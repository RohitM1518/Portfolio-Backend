// Frontend Integration Example for Portfolio Website
// This file contains utility functions to track user interactions

class InteractionTracker {
  constructor(baseUrl = 'http://localhost:8001/api/v1') {
    this.baseUrl = baseUrl;
    this.sessionId = this.generateSessionId();
  }

  // Generate a unique session ID
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Generic method to track interactions
  async trackInteraction(endpoint, data) {
    try {
      const response = await fetch(`${this.baseUrl}/interactions/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          sessionId: this.sessionId
        })
      });
      
      const result = await response.json();
      console.log(`✅ ${endpoint} tracked:`, result.message);
      return result;
    } catch (error) {
      console.error(`❌ Error tracking ${endpoint}:`, error);
    }
  }

  // Track resume download
  async trackResumeDownload(page = 'resume', element = 'download_button', metadata = {}) {
    return this.trackInteraction('resume-download', {
      page,
      element,
      metadata: {
        ...metadata,
        downloadTime: new Date().toISOString(),
        fileType: 'pdf'
      }
    });
  }

  // Track page visit
  async trackPageVisit(page, metadata = {}) {
    return this.trackInteraction('page-visit', {
      page,
      metadata: {
        ...metadata,
        referrer: document.referrer,
        visitTime: new Date().toISOString(),
        url: window.location.href
      }
    });
  }

  // Track button click
  async trackButtonClick(page, element, metadata = {}) {
    return this.trackInteraction('button-click', {
      page,
      element,
      metadata: {
        ...metadata,
        clickTime: new Date().toISOString()
      }
    });
  }

  // Track form submission
  async trackFormSubmission(page, element, metadata = {}) {
    return this.trackInteraction('form-submission', {
      page,
      element,
      metadata: {
        ...metadata,
        submissionTime: new Date().toISOString()
      }
    });
  }

  // Track link click
  async trackLinkClick(page, element, metadata = {}) {
    return this.trackInteraction('track', {
      type: 'link_click',
      page,
      element,
      metadata: {
        ...metadata,
        clickTime: new Date().toISOString()
      }
    });
  }

  // Track scroll depth
  async trackScrollDepth(page, depth, metadata = {}) {
    return this.trackInteraction('track', {
      type: 'scroll_depth',
      page,
      metadata: {
        ...metadata,
        depth,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Track time spent on page
  async trackTimeSpent(page, timeSpent, metadata = {}) {
    return this.trackInteraction('track', {
      type: 'time_spent',
      page,
      metadata: {
        ...metadata,
        timeSpent,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Track project view
  async trackProjectView(page, projectName, metadata = {}) {
    return this.trackInteraction('track', {
      type: 'project_view',
      page,
      element: 'project_card',
      metadata: {
        ...metadata,
        projectName,
        viewTime: new Date().toISOString()
      }
    });
  }

  // Track social media click
  async trackSocialMediaClick(page, platform, metadata = {}) {
    return this.trackInteraction('track', {
      type: 'social_media_click',
      page,
      element: 'social_link',
      metadata: {
        ...metadata,
        platform,
        clickTime: new Date().toISOString()
      }
    });
  }
}

// React Hook for interaction tracking
export const useInteractionTracking = () => {
  const tracker = new InteractionTracker();

  const trackResumeDownload = (page, element, metadata) => 
    tracker.trackResumeDownload(page, element, metadata);

  const trackPageVisit = (page, metadata) => 
    tracker.trackPageVisit(page, metadata);

  const trackButtonClick = (page, element, metadata) => 
    tracker.trackButtonClick(page, element, metadata);

  const trackFormSubmission = (page, element, metadata) => 
    tracker.trackFormSubmission(page, element, metadata);

  const trackLinkClick = (page, element, metadata) => 
    tracker.trackLinkClick(page, element, metadata);

  const trackScrollDepth = (page, depth, metadata) => 
    tracker.trackScrollDepth(page, depth, metadata);

  const trackTimeSpent = (page, timeSpent, metadata) => 
    tracker.trackTimeSpent(page, timeSpent, metadata);

  const trackProjectView = (page, projectName, metadata) => 
    tracker.trackProjectView(page, projectName, metadata);

  const trackSocialMediaClick = (page, platform, metadata) => 
    tracker.trackSocialMediaClick(page, platform, metadata);

  return {
    trackResumeDownload,
    trackPageVisit,
    trackButtonClick,
    trackFormSubmission,
    trackLinkClick,
    trackScrollDepth,
    trackTimeSpent,
    trackProjectView,
    trackSocialMediaClick
  };
};

// Vanilla JavaScript usage example
export const interactionTracker = new InteractionTracker();

// Example usage in HTML/JavaScript:
/*
<script type="module">
  import { interactionTracker } from './frontend-integration.js';

  // Track page visit when page loads
  document.addEventListener('DOMContentLoaded', () => {
    interactionTracker.trackPageVisit('home');
  });

  // Track resume download
  document.getElementById('download-resume').addEventListener('click', () => {
    interactionTracker.trackResumeDownload('resume', 'download_button', {
      resumeVersion: '2024',
      format: 'PDF'
    });
  });

  // Track button clicks
  document.getElementById('contact-button').addEventListener('click', () => {
    interactionTracker.trackButtonClick('home', 'contact_button', {
      buttonText: 'Contact Me',
      position: 'header'
    });
  });

  // Track form submission
  document.getElementById('contact-form').addEventListener('submit', (e) => {
    interactionTracker.trackFormSubmission('contact', 'contact_form', {
      formType: 'contact',
      hasAttachments: false
    });
  });

  // Track scroll depth
  let maxScrollDepth = 0;
  window.addEventListener('scroll', () => {
    const scrollDepth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
    if (scrollDepth > maxScrollDepth) {
      maxScrollDepth = scrollDepth;
      if (scrollDepth % 25 === 0) { // Track every 25%
        interactionTracker.trackScrollDepth('home', scrollDepth);
      }
    }
  });

  // Track time spent on page
  let startTime = Date.now();
  window.addEventListener('beforeunload', () => {
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    interactionTracker.trackTimeSpent('home', timeSpent);
  });
</script>
*/

// React component example:
/*
import React, { useEffect } from 'react';
import { useInteractionTracking } from './frontend-integration.js';

const ResumeSection = () => {
  const { trackResumeDownload, trackButtonClick } = useInteractionTracking();

  const handleDownload = () => {
    trackResumeDownload('resume', 'download_button', {
      resumeVersion: '2024',
      format: 'PDF'
    });
    // Actual download logic here
  };

  const handleContactClick = () => {
    trackButtonClick('resume', 'contact_button', {
      buttonText: 'Get In Touch',
      position: 'section'
    });
  };

  return (
    <div>
      <button onClick={handleDownload}>Download Resume</button>
      <button onClick={handleContactClick}>Get In Touch</button>
    </div>
  );
};
*/ 