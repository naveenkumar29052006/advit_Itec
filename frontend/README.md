## ChatBot

This is a team project for creating a responsive, embeddable chat interface.

### Features
- Floating chat button
- Authentication (login/signup)
- Modal interface with three main sections:
  - Home with FAQ
  - Messages
  - Help center
- Responsive design for both desktop and mobile

### Setup instructions
Run the following commands to set up the project on your local machine:

```bash
git clone https://github.com/AmanCrafts/ChatBot.git
cd ChatBot
npm install
npm run dev
```

### Usage
Open your browser and navigate to `http://localhost:5173` to see the chatbot in action.

### Development Guidelines
- Use the existing component structure
- Follow the established styling patterns
- Add appropriate comments for team collaboration
- Test on both desktop and mobile viewports

### API Integration
The chat is currently using mock data. When connecting to a backend:
- Update the authentication handlers in ModalWindow component
- Replace static data with API calls in App.jsx
- Implement real message sending in MessagesSection

### Team Collaboration
- Submit PRs for new features
- Update this documentation when adding new components
- Reference ticket numbers in commit messages