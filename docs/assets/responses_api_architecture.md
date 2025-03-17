[Architecture Diagram: OpenAI Responses API Integration]

Client Browser
    ↓ ↑
HTML/CSS/JS Application
    ↓ ↑
ResponsesAPI Facade
    ├─→ Legacy ChatAPI (Compatibility Layer)
    │       ↓ ↑
    │    OpenAI Chat Completions API
    │
    └─→ Modern ResponsesAPI
            ↓ ↑
        OpenAI Responses API
            ↓ ↑
        [Tool Services]
        - Web Search
        - File Management
        - Image Processing

Legend:
→ Data flow
↓↑ Two-way communication

Note: This is a text representation of the architecture diagram.
An actual diagram image would be created using a tool like draw.io or Figma. 