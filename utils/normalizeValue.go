package utils

import (
	"fmt"
	"unicode/utf8"
)

// NormalizeValue normalizes database values for UI display,
// converting valid UTF-8 byte slices to strings and binary data to a BLOB label.
func NormalizeValue(val any) any {
	if val == nil {
		return nil
	}
	switch v := val.(type) {
	case []byte:
		if utf8.Valid(v) {
			return string(v)
		}
		return fmt.Sprintf("BLOB (%d bytes)", len(v))
	default:
		return v
	}
}
