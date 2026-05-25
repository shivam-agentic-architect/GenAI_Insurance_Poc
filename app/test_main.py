import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app

client = TestClient(app)

def test_home():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "RAG System Running ✅"}

def test_ask_missing_query_param():
    # If we pass empty string for q, it should trigger the 400 error we explicitly raise
    response = client.get("/ask?q=")
    assert response.status_code == 400
    assert response.json() == {"detail": "Missing query parameter 'q'"}

    # If we don't pass q at all, FastAPI's validation should throw 422
    response_422 = client.get("/ask")
    assert response_422.status_code == 422

@patch("app.main.retrieve")
@patch("app.main.os.getenv")
@patch("app.main.OpenAI")
def test_ask_valid_query(mock_openai_class, mock_getenv, mock_retrieve):
    # Mocking the retrieve function
    mock_retrieve.return_value = "Dummy context information."

    # Mocking environment variable
    mock_getenv.return_value = "dummy-api-key"

    # Mocking OpenAI client and its response
    mock_client_instance = MagicMock()
    mock_openai_class.return_value = mock_client_instance
    mock_completion = MagicMock()
    mock_message = MagicMock()
    mock_message.message.content = "Dummy AI response"
    mock_completion.choices = [mock_message]
    mock_client_instance.chat.completions.create.return_value = mock_completion

    response = client.get("/ask?q=What is insurance?")

    assert response.status_code == 200
    assert response.json() == {"response": "Dummy AI response"}

    # Verify our mocks were called correctly
    mock_retrieve.assert_called_once_with("What is insurance?")
    mock_getenv.assert_called_once_with("OPENAI_API_KEY")
    mock_client_instance.chat.completions.create.assert_called_once()

@patch("app.main.retrieve")
@patch("app.main.os.getenv")
def test_ask_missing_api_key(mock_getenv, mock_retrieve):
    mock_retrieve.return_value = "Dummy context information."
    # Simulate missing API key
    mock_getenv.return_value = None

    response = client.get("/ask?q=What is insurance?")

    assert response.status_code == 500
    assert response.json() == {"detail": "500: OPENAI_API_KEY not configured on server."}

@patch("app.main.retrieve")
@patch("app.main.os.getenv")
@patch("app.main.OpenAI")
def test_ask_authentication_error(mock_openai_class, mock_getenv, mock_retrieve):
    mock_retrieve.return_value = "Dummy context information."
    mock_getenv.return_value = "invalid-api-key"

    # Mock OpenAI client initialization to throw AuthenticationError-like exception
    mock_client_instance = MagicMock()
    mock_openai_class.return_value = mock_client_instance

    # When creating completion, raise an Exception that has "AuthenticationError" in traceback/details
    class MockAuthenticationError(Exception):
        pass

    mock_client_instance.chat.completions.create.side_effect = MockAuthenticationError("AuthenticationError: Invalid API Key provided.")

    response = client.get("/ask?q=What is insurance?")

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid OpenAI API Key. Please check your .env file."}
