"""Contains the lambda response functions and headers

Returns:
    dict: The lambda response
"""

HEADERS = {
    'Content-Type': 'application/json',  # noqa: Q000
    'Access-Control-Allow-Headers': '*',  # noqa: Q000
    'Access-Control-Allow-Origin': '*',  # noqa: Q000
    'Access-Control-Allow-Methods': '*',  # noqa: Q000
}


def RESPONSE(body: dict, status_code: int = 200, headers: dict = HEADERS) -> dict:  # noqa: N802
    return {
        'statusCode': status_code,  # noqa: Q000
        'headers': headers,  # noqa: Q000
        'body': body,  # noqa: Q000
    }
