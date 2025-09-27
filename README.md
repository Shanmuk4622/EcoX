# EnviroWatch - Real-Time CO Monitoring Dashboard

EnviroWatch is a modern, real-time dashboard for monitoring Carbon Monoxide (CO) levels from a network of IoT sensors. Built with Next.js and Firebase, it provides a comprehensive overview of sensor data, geographical locations, and an intelligent alert system powered by Google's Gemini models through Genkit.

![EnviroWatch Dashboard](https://storage.googleapis.com/stabl-innersource-public-assets/studio-readme-assets/envirowatch-screenshot.png)

## Features

- **Real-Time Monitoring**: Live data streams from sensors are displayed instantly using Firebase Firestore's real-time capabilities.
- **Interactive Dashboard**: A comprehensive overview of all devices, including status summaries, live charts, and recent alerts.
- **Device Details**: Drill down into individual device data, viewing current CO levels and historical trends.
- **Geospatial Mapping**: An interactive map visualizes the geographical location of each sensor, with color-coded pins indicating their status.
- **AI-Powered Anomaly Detection**: A Genkit flow proactively analyzes sensor data to detect and explain unusual CO level spikes that might not breach simple thresholds.
- **Conversational AI Assistant**: Chat with an AI-powered assistant to get quick insights about device statuses, alerts, or CO levels (e.g., "Which devices are in a critical state?").
- **Audible Alerts**: The application provides immediate auditory feedback for 'Warning' (2 beeps) and 'Critical' (continuous alarm) CO levels, ensuring that urgent situations are never missed.
- **Theming**: Includes a modern, clean UI with support for both light and dark modes.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI**: [React](https://react.dev/), [ShadCN UI](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)
- **AI**: [Genkit](https://firebase.google.com/docs/genkit) with Google's Gemini models.
- **Database**: [Firebase Firestore](https://firebase.google.com/docs/firestore) (for real-time data)
- **Charting**: [Recharts](https://recharts.org/)
- **Mapping**: [Google Maps Platform](https://developers.google.com/maps) (`@vis.gl/react-google-maps`)
- **Authentication**: [Firebase Authentication](https://firebase.google.com/docs/auth)

## Getting Started

Follow these instructions to get a local copy up and running.

### Prerequisites

- Node.js (v18 or newer)
- An active Firebase project.
- A Google Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
- A Google Maps API key from the [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/overview).

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a file named `.env.local` in the root of your project and add your Firebase and Google API credentials.

    ```env
    # Firebase Client Configuration (get this from your Firebase project settings)
    NEXT_PUBLIC_FIREBASE_API_KEY="your_firebase_api_key"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_firebase_auth_domain"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_firebase_project_id"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_firebase_storage_bucket"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_firebase_messaging_sender_id"
    NEXT_PUBLIC_FIREBASE_APP_ID="your_firebase_app_id"

    # Firebase Admin SDK (for server-side operations)
    # This is the JSON content of your service account key, base64 encoded.
    FIREBASE_SERVICE_ACCOUNT_KEY="your_base64_encoded_service_account_key"

    # Google Gemini API Key (for Genkit AI features)
    GEMINI_API_KEY="your_gemini_api_key"
    
    # Google Maps API Key (for the map view)
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your_google_maps_api_key"
    ```

    *To get the `FIREBASE_SERVICE_ACCOUNT_KEY`, go to your Firebase project settings, navigate to "Service accounts," generate a new private key, and then base64 encode the contents of the downloaded JSON file.*

4.  **Seed the Database (Optional):**
    To populate your Firestore database with initial sample data, run the seed script by navigating to `/api/seed` in your browser or using a tool like `curl`:
    ```bash
    curl http://localhost:9002/api/seed
    ```

5.  **Run the Development Server:**
    This command starts both the Next.js frontend and the Genkit development server.
    ```bash
    npm run dev
    ```

    Open [http://localhost:9002](http://localhost:9002) with your browser to see the result. The Genkit developer UI will be available at [http://localhost:4000](http://localhost:4000).

## How It Works

### Data Flow

1.  **Sensor Data**: Simulated or real sensor data is pushed to the `devices` collection in Firestore.
2.  **Real-Time Sync**: The Next.js client subscribes to the `devices` collection using `onSnapshot`.
3.  **UI Updates**: The `DashboardComponent` receives live data, updates the state, and re-renders all components, including charts, tables, and maps.

### AI Features

- **Anomaly Detection**: The `detectCoAnomaly` Genkit flow is triggered on the server whenever a device's data is updated. It analyzes the new reading in the context of its historical data to flag potential anomalies.
- **Chatbot**: The `Chatbot` component sends user queries to the `chatbotFlow` Genkit flow, which has access to real-time device and alert data, allowing it to answer questions about the system's current state.
