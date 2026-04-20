use crate::is_card_valid;

// expiry: card still valid

#[test]
fn test_valid_future_year() {
    assert(is_card_valid(2028, 6, 2026, 4));
}

#[test]
fn test_valid_same_year_later_month() {
    assert(is_card_valid(2026, 6, 2026, 4));
}

#[test]
fn test_valid_same_year_same_month() {
    // expires this exact month - still valid
    assert(is_card_valid(2026, 4, 2026, 4));
}

// expiry: card expired

#[test(should_fail_with = "card is expired")]
fn test_expired_past_year() {
    assert(is_card_valid(2025, 12, 2026, 4), "card is expired");
}

#[test(should_fail_with = "card is expired")]
fn test_expired_same_year_past_month() {
    assert(is_card_valid(2026, 3, 2026, 4), "card is expired");
}
