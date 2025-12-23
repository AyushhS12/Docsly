use axum::{Json, http::StatusCode, response::IntoResponse};
use serde_json::json;
use tower_cookies::Cookies;

use crate::utils::decode_cookie;
