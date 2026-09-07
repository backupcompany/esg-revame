package api

import "testing"

func TestRosterAllows(t *testing.T) {
	cases := []struct {
		enforce, admin, onRoster, want bool
	}{
		{true, false, false, false},
		{true, false, true, true},
		{true, true, false, true},
		{false, false, false, true},
	}
	for _, c := range cases {
		got := rosterAllows(c.enforce, c.admin, c.onRoster)
		if got != c.want {
			t.Fatalf("rosterAllows(%v,%v,%v)=%v want %v", c.enforce, c.admin, c.onRoster, got, c.want)
		}
	}
}

func TestCanCreateUnlinkedVendor(t *testing.T) {
	if canCreateUnlinkedVendor(roleVendorMember) || canCreateUnlinkedVendor(roleVendorAdmin) || canCreateUnlinkedVendor(roleAdmin) {
		t.Fatal("walk-in must stay closed")
	}
	if !canCreateUnlinkedVendor(roleSuperAdmin) {
		t.Fatal("super_admin may create")
	}
}

func TestPickExcelHeaders(t *testing.T) {
	row := map[string]any{
		"Company Name": "Acme",
		"ALLOWED EMAILS": "A@B.co",
		"Employee_Count": "25-50",
	}
	if pick(row, "companyName") != "Acme" {
		t.Fatalf("company: %q", pick(row, "companyName"))
	}
	if pick(row, "allowedEmails") != "A@B.co" {
		t.Fatalf("emails: %q", pick(row, "allowedEmails"))
	}
	if pick(row, "employeeCount") != "25-50" {
		t.Fatalf("employees: %q", pick(row, "employeeCount"))
	}
}
