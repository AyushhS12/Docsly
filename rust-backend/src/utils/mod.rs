use axum::http::request::Parts;
use jsonwebtoken::{DecodingKey, Validation, decode};
use tower_cookies::Cookie;

use crate::models::{self};

pub async fn extract_cookies(parts: &Parts) -> Option<models::Claims> {
    let cookie = parts.headers.get("Cookie");
    match cookie {
        Some(c) => {
            let jwt = c.to_str().unwrap();
            if let Some((_, token)) = jwt.split_once("=") {
                let key = &DecodingKey::from_secret("hello".as_ref());
                let claims = decode::<models::Claims>(token, key, &Validation::default());
                match claims {
                    Ok(c) => Some(c.claims),
                    Err(e) => {
                        log::error!("{}", e.to_string());
                        None
                    }
                }
            } else {
                None
            }
        }
        None => None,
    }
}

pub async fn decode_cookie(cookie: Cookie<'_>) -> Option<models::Claims> {
    let (name, token) = (cookie.name(), cookie.value());
    if !(name == "token") {
        log::error!("name did not match\nname: {}",name);
        return None;
    }
    let key = &DecodingKey::from_secret("hello".as_ref());
    let claims = decode::<models::Claims>(token, key, &Validation::default());
    match claims {
        Ok(c) => Some(c.claims),
        Err(e) => {
            log::error!("{}", e.to_string());
            None
        }
    }
}

// pub async fn extract_id_from_parts(parts: &Parts) -> Option<impl IntoObjectId>{
//     let cookies = parts.
//     Some(String::new())
// }
