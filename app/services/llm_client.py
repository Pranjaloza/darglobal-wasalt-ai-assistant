import requests

from app import config
from app.services.errors import ServiceError


def chat_completion(system_prompt, user_prompt, temperature, max_tokens=None, history=None):
    """Send a chat request to OpenRouter and return (answer, model).

    Retries once if the model returns no answer text, which happens when a
    reasoning model spends its whole token budget thinking.
    """

    if not config.OPENROUTER_API_KEY:
        raise ServiceError(500, "OpenRouter API key is not configured.")

    last_error = None
    for _ in range(config.LLM_MAX_ATTEMPTS):
        try:
            return _request_once(
                system_prompt,
                user_prompt,
                temperature,
                max_tokens or config.LLM_MAX_TOKENS,
                history or []
            )
        except EmptyAnswerError as error:
            last_error = error

    raise ServiceError(502, str(last_error))


class EmptyAnswerError(Exception):
    pass


def _request_once(system_prompt, user_prompt, temperature, max_tokens, history):
    try:
        response = requests.post(
            config.OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {config.OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "X-OpenRouter-Title": config.OPENROUTER_APP_TITLE
            },
            json={
                "model": config.OPENROUTER_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    *history,
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": temperature,
                "max_tokens": max_tokens,
                "reasoning": {
                    "effort": config.LLM_REASONING_EFFORT,
                    "exclude": True
                }
            },
            timeout=config.LLM_TIMEOUT_SECONDS
        )
        response.raise_for_status()
        data = response.json()

    except requests.exceptions.RequestException as error:
        raise ServiceError(502, f"OpenRouter request failed: {error}")

    except ValueError:
        raise ServiceError(502, "The AI provider returned an unexpected response.")

    if "error" in data:
        message = (data["error"] or {}).get("message", "unknown error")
        raise ServiceError(502, f"OpenRouter error: {message}")

    choices = data.get("choices") or []
    if not choices:
        raise EmptyAnswerError("OpenRouter returned no choices.")

    answer = (choices[0].get("message") or {}).get("content")
    if not isinstance(answer, str) or not answer.strip():
        model = data.get("model", config.OPENROUTER_MODEL)
        reason = choices[0].get("finish_reason")
        raise EmptyAnswerError(
            f"The AI model ({model}) returned no answer (finish_reason={reason}). "
            "Please try again."
        )

    return answer, data.get("model", config.OPENROUTER_MODEL)
