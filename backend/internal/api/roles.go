package api

const (
	roleSuperAdmin   = "super_admin"
	roleAdmin        = "admin"
	roleVendorAdmin  = "vendor_admin"
	roleVendorMember = "vendor_member"
	roleVendorLegacy = "vendor"
)

func isAdmin(role string) bool {
	return role == roleSuperAdmin || role == roleAdmin
}

// Walk-in create is closed: only super_admin may INSERT a vendor when user has no vendor_id.
func canCreateUnlinkedVendor(role string) bool {
	return role == roleSuperAdmin
}

// rosterAllows is the VOB gate: operators skip the email list; everyone else
// must be on vendor_allowed_emails when ESG_ENFORCE_ALLOWLIST=true.
func rosterAllows(enforce, admin, onRoster bool) bool {
	if admin {
		return true
	}
	if !enforce {
		return true
	}
	return onRoster
}
