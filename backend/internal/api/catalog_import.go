package api

import (
	"bytes"
	"encoding/csv"
	"io"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/xuri/excelize/v2"

	"esg-together/backend/internal/httpx"
)

func col(row map[string]string, keys ...string) string {
	byKey := make(map[string]string, len(row))
	for k, v := range row {
		byKey[pickKey(k)] = v
	}
	for _, k := range keys {
		if v := strings.TrimSpace(byKey[pickKey(k)]); v != "" {
			return v
		}
	}
	return ""
}

func splitTips(raw string) []string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return []string{"Terapkan sesuai SOP", "Dokumentasikan hasil implementasi"}
	}
	parts := strings.Split(raw, ";")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	if len(out) == 0 {
		return []string{"Terapkan sesuai SOP", "Dokumentasikan hasil implementasi"}
	}
	return out
}

func parseCatalogRows(table [][]string) []gin.H {
	if len(table) < 2 {
		return nil
	}
	headers := make([]string, len(table[0]))
	for i, h := range table[0] {
		headers[i] = strings.TrimSpace(h)
	}
	out := make([]gin.H, 0, len(table)-1)
	for _, raw := range table[1:] {
		row := map[string]string{}
		empty := true
		for i, h := range headers {
			if h == "" {
				continue
			}
			v := ""
			if i < len(raw) {
				v = strings.TrimSpace(raw[i])
			}
			row[h] = v
			if v != "" {
				empty = false
			}
		}
		if empty {
			continue
		}
		titleID := col(row, "Judul Aksi (Bahasa Indonesia)*", "Judul (Bahasa Indonesia)", "titleId", "Judul")
		titleEN := col(row, "Judul Aksi (English)", "Judul (English)", "title")
		if titleEN == "" {
			titleEN = titleID
		}
		if titleEN == "" && titleID == "" {
			continue
		}
		pillar := strings.ToUpper(col(row, "Pilar (E/S/G)*", "Pilar", "pillar"))
		if pillar != "E" && pillar != "S" && pillar != "G" {
			pillar = "E"
		}
		diff := col(row, "Tingkat Kesulitan (Starter/Moderate/Advanced)*", "Tingkat Kesulitan", "difficulty")
		if _, ok := allowedDifficulty[diff]; !ok {
			diff = "Starter"
		}
		evid := strings.ToLower(col(row, "Tipe Bukti Audit (photo/document/both)*", "Tipe Bukti", "requiredEvidenceType"))
		if _, ok := allowedEvidenceType[evid]; !ok {
			evid = "both"
		}
		days, _ := strconv.Atoi(col(row, "Estimasi Hari Pengerjaan", "Estimasi Hari", "estimatedDays"))
		if days < 1 {
			days = 7
		}
		mult, _ := strconv.ParseFloat(col(row, "Nilai Pengali Dampak (Multiplier)", "Nilai Pengali", "impactMultiplier"), 64)
		if mult == 0 {
			mult = 50
		}
		pts, _ := strconv.Atoi(col(row, "Poin Penghargaan (PTS)*", "Poin (PTS)", "points"))
		if pts < 1 {
			pts = 100
		}
		unit := col(row, "Satuan Metrik Dampak*", "Satuan Metrik", "impactMetricUnit")
		if unit == "" {
			unit = "Units"
		}
		label := col(row, "Label Metrik Dampak", "Label Metrik", "impactMetricLabel")
		if label == "" {
			label = "Dampak Dihasilkan"
		}
		catID := col(row, "Kategori*", "Kategori", "categoryId")
		if catID == "" {
			catID = "Umum"
		}
		catEN := col(row, "Kategori (English)", "category")
		if catEN == "" {
			catEN = catID
		}
		descID := col(row, "Deskripsi (Bahasa Indonesia)*", "Deskripsi (Bahasa Indonesia)", "descriptionId", "Deskripsi")
		descEN := col(row, "Deskripsi (English)", "description")
		if descEN == "" {
			descEN = descID
		}
		img := col(row, "URL Gambar (Opsional)", "URL Gambar", "imageUrl")
		if cleaned, ok := httpx.HTTPSURL(img, 500); ok {
			img = cleaned
		} else {
			img = ""
		}
		tips := splitTips(col(row, "Tips Praktis (Pisahkan dengan tanda titik-koma ;)", "Tips Praktis", "practicalTips"))
		id := strings.ToLower(strings.ReplaceAll(strings.TrimSpace(col(row, "ID Aksi (Opsional)", "ID Aksi", "id", "ID")), " ", "_"))
		item := gin.H{
			"pillar": pillar, "title": titleEN, "titleId": titleID,
			"category": catEN, "categoryId": catID,
			"description": descEN, "descriptionId": descID,
			"difficulty": diff, "estimatedDays": days,
			"impactMetricUnit": unit, "impactMetricUnitId": unit,
			"impactMetricLabel": label, "impactMetricLabelId": label,
			"impactMultiplier": mult, "points": pts,
			"requiredEvidenceType": evid, "imageUrl": img,
			"practicalTips": tips, "practicalTipsId": tips,
			"isActive": true, "source": "excel_import",
		}
		if id != "" {
			item["id"] = id
		}
		out = append(out, item)
		if len(out) >= 100 {
			break
		}
	}
	return out
}

func (s *Server) parseCatalogExcel(c *gin.Context) {
	if _, ok := s.requireSuper(c); !ok {
		return
	}
	fh, err := c.FormFile("file")
	if err != nil || fh == nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "file required")
		return
	}
	if fh.Size > 4<<20 {
		httpx.Error(c.Writer, http.StatusBadRequest, "file too large")
		return
	}
	f, err := fh.Open()
	if err != nil {
		httpx.Error(c.Writer, http.StatusBadRequest, "cannot read file")
		return
	}
	defer f.Close()
	raw, err := io.ReadAll(io.LimitReader(f, 4<<20+1))
	if err != nil || len(raw) == 0 {
		httpx.Error(c.Writer, http.StatusBadRequest, "empty file")
		return
	}
	name := strings.ToLower(filepath.Base(fh.Filename))
	if !spreadsheetMagicOK(name, raw) {
		httpx.Error(c.Writer, http.StatusBadRequest, "only csv or excel")
		return
	}
	var table [][]string
	switch {
	case strings.HasSuffix(name, ".csv"):
		r := csv.NewReader(bytes.NewReader(raw))
		r.LazyQuotes = true
		r.FieldsPerRecord = -1
		table, err = r.ReadAll()
		if err != nil {
			httpx.Error(c.Writer, http.StatusBadRequest, "invalid csv")
			return
		}
	case strings.HasSuffix(name, ".xlsx") || strings.HasSuffix(name, ".xls"):
		xf, err := excelize.OpenReader(bytes.NewReader(raw))
		if err != nil {
			httpx.Error(c.Writer, http.StatusBadRequest, "invalid spreadsheet")
			return
		}
		defer xf.Close()
		sheets := xf.GetSheetList()
		if len(sheets) == 0 {
			httpx.Error(c.Writer, http.StatusBadRequest, "empty workbook")
			return
		}
		table, err = xf.GetRows(sheets[0])
		if err != nil {
			httpx.Error(c.Writer, http.StatusBadRequest, "cannot read sheet")
			return
		}
	default:
		httpx.Error(c.Writer, http.StatusBadRequest, "xlsx or csv only")
		return
	}
	actions := parseCatalogRows(table)
	if actions == nil {
		actions = []gin.H{}
	}
	httpx.JSON(c.Writer, http.StatusOK, gin.H{"actions": actions})
}

func spreadsheetMagicOK(name string, raw []byte) bool {
	switch {
	case strings.HasSuffix(name, ".csv"):
		return len(raw) > 0 && raw[0] != 0 && raw[0] != 0xD0 && !bytes.HasPrefix(raw, []byte("PK"))
	case strings.HasSuffix(name, ".xlsx"):
		return bytes.HasPrefix(raw, []byte("PK"))
	case strings.HasSuffix(name, ".xls"):
		return len(raw) >= 4 && raw[0] == 0xD0 && raw[1] == 0xCF && raw[2] == 0x11 && raw[3] == 0xE0
	default:
		return false
	}
}
