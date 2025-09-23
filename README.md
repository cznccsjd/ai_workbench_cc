# AI Workbench

AI Workbench is a next-generation productivity tool designed to integrate AI capabilities seamlessly into your daily workflow, enhancing note-taking, task management, and project collaboration.

## 🎯 Project Status

**Current Phase**: Core Development Complete (75% MVP Finished)
**Last Updated**: 2025-09-23
**Active Branch**: develop

### ✅ Completed Features (Ready for Use)

-   **AI-Powered Notepad** ✅ - Automatically organize your thoughts and extract tasks
    -   Smart text organization with Markdown formatting
    -   Automatic TODO extraction from notes
    -   Three-column responsive layout
    -   Real-time saving and sync
-   **Multi-Model AI Chat** ✅ - Chat with Kimi and other large language models
    -   Streaming responses with 83% test coverage
    -   API key management and security
    -   Chat history and session management
-   **Pomodoro Timer** ✅ - Stay focused and manage your time effectively
    -   25/5/15 minute work/break cycles with 92% test coverage
    -   Smart session switching and statistics
    -   Browser notifications and sound alerts
    -   Backend data synchronization
-   **Kanban Project Management** ✅ - Visualize your workflow with a Trello-like board system
    -   **Board Management**: Create and manage multiple project boards
    -   **Drag & Drop**: Intuitive card and list reordering with @dnd-kit (<50ms response)
    -   **List Organization**: Customizable columns (To Do, In Progress, Done)
    -   **Card Features**: Titles, descriptions, due dates, priority levels, and color labels
    -   **Mobile Responsive**: Full touch support for mobile devices
    -   **Real-time Sync**: Instant updates with backend synchronization
    -   **Performance**: Supports 1000+ cards with smooth operation

### 🔧 In Development

-   **Theming System** - Multiple modern themes (Apple Minimalism, Cyber Dark, Bento Grid)
-   **Test Coverage Enhancement** - Improving overall test coverage
-   **CI/CD Pipeline** - Automated testing and deployment

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