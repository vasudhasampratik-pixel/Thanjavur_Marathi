from firebase_admin import auth


class AuthenticationError(Exception):
    pass


def verify_bearer_token(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise AuthenticationError("A Firebase bearer token is required.")

    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise AuthenticationError("A Firebase bearer token is required.")

    try:
        decoded_token = auth.verify_id_token(token)
    except Exception as exc:
        raise AuthenticationError("The Firebase token is invalid or expired.") from exc

    uid = decoded_token.get("uid")
    if not isinstance(uid, str) or not uid:
        raise AuthenticationError("The Firebase token did not contain a user identity.")
    return uid
