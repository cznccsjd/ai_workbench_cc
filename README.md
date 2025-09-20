# AI Workbench

AI Workbench is a next-generation productivity tool designed to integrate AI capabilities seamlessly into your daily workflow, enhancing note-taking, task management, and project collaboration.

## Features

-   **AI-Powered Notepad**: Automatically organize your thoughts and extract tasks.
-   **Multi-Model Chat**: Chat with Kimi and other large language models.
-   **Pomodoro Timer**: Stay focused and manage your time effectively.
-   **Kanban Project Management**: Visualize your workflow with a Trello-like board.
-   **Theming System**: Customize the look and feel with multiple modern themes.

## Tech Stack

-   **Backend**: Python 3.11+, FastAPI
-   **Frontend**: React (Next.js)
-   **Database**: PostgreSQL (Production), SQLite (Development)
-   **Testing**: Pytest, Playwright
-   **AI Integration**: Kimi (initially)

## Getting Started

### Prerequisites

-   Python 3.11+
-   Node.js 20.x+
-   Git

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd ai-workbench
    ```

2.  **Setup Backend (Python):**
    ```bash
    # Create and activate a virtual environment
    python3 -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`

    # Install dependencies
    pip install -r requirements.txt
    ```

3.  **Setup Frontend (Node.js):**
    ```bash
    # Navigate to the frontend directory (assuming it's named 'frontend')
    cd frontend

    # Install dependencies
    npm install
    ```

4.  **Environment Configuration:**
    -   Create a `.env` file in the root directory.
    -   Add your Kimi API key:
        ```env
        KIMI_API_KEY="your_api_key_here"
        ```

### Running the Application

1.  **Start the Backend Server:**
    ```bash
    # From the root directory
    uvicorn main:app --reload
    ```

2.  **Start the Frontend Development Server:**
    ```bash
    # From the 'frontend' directory
    npm run dev
    ```

Open your browser and navigate to `http://localhost:3000`.

## Contribution

Please follow the guidelines in `CLAUDE.md` for branching, commits, and development practices.