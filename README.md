# Portfolio Website Backend

A Node.js/Express.js backend for tracking user interactions on your portfolio website using MongoDB Atlas.

## Features

- **User Interaction Tracking**: Track various user interactions including resume downloads, page visits, button clicks, and form submissions
- **Analytics**: Get detailed statistics and analytics about user interactions
- **MongoDB Integration**: Uses MongoDB Atlas for data storage
- **RESTful API**: Clean and well-structured REST API endpoints

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with your configuration:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/portfolio-interactions
CORS_ORIGIN=http://localhost:5173
PORT=8001
```

3. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Track Interactions

#### 1. Track General Interaction
```http
POST /api/v1/interactions/track
```

**Request Body:**
```json
{
  "type": "button_click",
  "page": "home",
  "element": "contact_button",
  "metadata": {
    "buttonText": "Contact Me",
    "position": "header"
  }
}
```

#### 2. Track Resume Download
```http
POST /api/v1/interactions/resume-download
```

**Request Body:**
```json
{
  "page": "resume",
  "element": "download_button",
  "metadata": {
    "resumeVersion": "2024",
    "format": "PDF"
  }
}
```

#### 3. Track Page Visit
```http
POST /api/v1/interactions/page-visit
```

**Request Body:**
```json
{
  "page": "about",
  "metadata": {
    "referrer": "google.com",
    "timeSpent": 120
  }
}
```

#### 4. Track Button Click
```http
POST /api/v1/interactions/button-click
```

**Request Body:**
```json
{
  "page": "projects",
  "element": "github_link",
  "metadata": {
    "projectName": "Portfolio Website",
    "linkType": "external"
  }
}
```

#### 5. Track Form Submission
```http
POST /api/v1/interactions/form-submission
```

**Request Body:**
```json
{
  "page": "contact",
  "element": "contact_form",
  "metadata": {
    "formType": "contact",
    "hasAttachments": false
  }
}
```

### Get Analytics

#### 1. Get Interaction Statistics
```http
GET /api/v1/interactions/stats?startDate=2024-01-01&endDate=2024-12-31&type=resume_download&page=resume
```

**Query Parameters:**
- `startDate` (optional): Start date for filtering (YYYY-MM-DD)
- `endDate` (optional): End date for filtering (YYYY-MM-DD)
- `type` (optional): Filter by interaction type
- `page` (optional): Filter by page

#### 2. Get Resume Download Statistics
```http
GET /api/v1/interactions/resume-downloads?startDate=2024-01-01&endDate=2024-12-31
```

### Health Check
```http
GET /health
```

## Interaction Types

The following interaction types are supported:

- `resume_download` - When user downloads resume
- `page_visit` - When user visits a page
- `button_click` - When user clicks a button
- `form_submission` - When user submits a form
- `link_click` - When user clicks a link
- `scroll_depth` - Track scroll depth on pages
- `time_spent` - Track time spent on pages
- `contact_form` - Contact form interactions
- `project_view` - When user views project details
- `social_media_click` - Social media link clicks

## Frontend Integration

### JavaScript Example

```javascript
// Track resume download
const trackResumeDownload = async () => {
  try {
    const response = await fetch('http://localhost:8001/api/v1/interactions/resume-download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page: 'resume',
        element: 'download_button',
        metadata: {
          resumeVersion: '2024',
          format: 'PDF'
        }
      })
    });
    
    const data = await response.json();
    console.log('Download tracked:', data);
  } catch (error) {
    console.error('Error tracking download:', error);
  }
};

// Track page visit
const trackPageVisit = async (pageName) => {
  try {
    const response = await fetch('http://localhost:8001/api/v1/interactions/page-visit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page: pageName,
        metadata: {
          referrer: document.referrer,
          timeSpent: 0
        }
      })
    });
    
    const data = await response.json();
    console.log('Page visit tracked:', data);
  } catch (error) {
    console.error('Error tracking page visit:', error);
  }
};

// Track button click
const trackButtonClick = async (page, element, metadata = {}) => {
  try {
    const response = await fetch('http://localhost:8001/api/v1/interactions/button-click', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page,
        element,
        metadata
      })
    });
    
    const data = await response.json();
    console.log('Button click tracked:', data);
  } catch (error) {
    console.error('Error tracking button click:', error);
  }
};
```

### React Hook Example

```javascript
import { useCallback } from 'react';

const useInteractionTracking = () => {
  const trackInteraction = useCallback(async (endpoint, data) => {
    try {
      const response = await fetch(`http://localhost:8001/api/v1/interactions/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  }, []);

  return {
    trackResumeDownload: (data) => trackInteraction('resume-download', data),
    trackPageVisit: (data) => trackInteraction('page-visit', data),
    trackButtonClick: (data) => trackInteraction('button-click', data),
    trackFormSubmission: (data) => trackInteraction('form-submission', data)
  };
};
```

## Data Structure

Each interaction is stored with the following fields:

- `type`: Type of interaction
- `page`: Page where interaction occurred
- `element`: Specific element interacted with (optional)
- `userAgent`: Browser user agent
- `ipAddress`: User's IP address
- `referrer`: Referring page
- `sessionId`: Session identifier
- `metadata`: Additional data (flexible object)
- `timestamp`: When interaction occurred

## Environment Variables

- `MONGODB_URI`: MongoDB connection string
- `CORS_ORIGIN`: Allowed CORS origin
- `PORT`: Server port (default: 8001)

## Development

- **Port**: 8001 (different from your main server)
- **Database**: Uses separate database `portfolio-interactions`
- **CORS**: Configured for frontend development

## Security Considerations

- IP addresses are stored for analytics but consider privacy implications
- User agents are stored for browser analytics
- Consider implementing rate limiting for production
- Add authentication if needed for admin endpoints 