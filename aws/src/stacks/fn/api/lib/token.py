"""
Token parsing module
"""

# ==================================================================================================
# Python imports
import base64
import json


def parse_token(token: str) -> dict:
    base64_token = token.split(".")[1]
    # Replace URL-safe characters and add padding
    base64_token = base64_token.replace("-", "+").replace("_", "/")
    padding = len(base64_token) % 4
    if padding:
        base64_token += "=" * (4 - padding)
    return json.loads(base64.b64decode(base64_token).decode("utf-8"))
