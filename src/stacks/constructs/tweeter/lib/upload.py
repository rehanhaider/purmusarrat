"""
# --*-- coding: utf-8 --*--
# This function is responsible for uploading media files to Twitter.
# --------------------------------------------------------------
# Uses Tweepy library to interact with Twitter API.
# Citation: Harmon, Roesslein, J., & other contributors. Tweepy [Computer software]. https://doi.org/10.5281/zenodo.7259945
# --------------------------------------------------------------
"""

import tweepy
import tweepy.errors

API_KEY = "z9e7oIBVCyZbnrPoFszvZx0HA"
API_SECRET = "i6KW4LL7devav0ZmYixRvId0ykCY3Xxsh3ATt6nOozcWfbRj7q"

ACCESS_TOKEN = "1653230262-6GLvDmFes72udBOG0L2uFJiRzklGivzAqt0AEYP"
ACCESS_SECRET = "zRwOj5KXOkfqiQWwsDhOma7gbdYVwjSCQyjGLf9mUMGcY"

client = tweepy.Client(
    consumer_key=API_KEY,
    consumer_secret=API_SECRET,
    access_token=ACCESS_TOKEN,
    access_token_secret=ACCESS_SECRET,
    wait_on_rate_limit=True,
)

auth = tweepy.OAuthHandler(
    consumer_key=API_KEY,
    consumer_secret=API_SECRET,
    access_token=ACCESS_TOKEN,
    access_token_secret=ACCESS_SECRET,
)

api = tweepy.API(auth, wait_on_rate_limit=True)


def get_text_from_name(name: str) -> str:
    """
    Get text from name of the media file. The name is expected to be in the format "text-timestamp.mp4"
    Remove the timestamp and replace "-" with " "

    Args:
    name: str: Name

    Returns:
    str: Text
    """

    # Split the filename on the period to remove the extension
    name_without_extension = name.split(".")[0]

    # Replace hyphens with spaces
    cleaned_name = name_without_extension.replace("-", " ")

    # Split the cleaned name on spaces and discard the last element (the timestamp)
    cleaned_name_parts = cleaned_name.split(" ")[:-1]

    # Join the parts back together with spaces
    final_name = " ".join(cleaned_name_parts)

    return final_name


def upload_media(file_path: str):
    """
    Upload media file to Twitter

    Args:
    file_path: str: Path to media file

    Returns:
    str: Media ID
    """
    media_id = api.media_upload(file_path).media_id_string  # type: ignore
    print(media_id)
    status = api.get_media_upload_status(media_id=media_id)
    try:
        client.create_tweet(text=get_text_from_name(file_path), media_ids=[media_id])
    except tweepy.errors.BadRequest as e:
        raise Exception(f"Error uploading media: {e}")
