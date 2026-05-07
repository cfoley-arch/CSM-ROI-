# CSM ROI Calculator

An interactive React dashboard for calculating the ROI of ATS (Applicant Tracking System) implementations using AI-powered insights.

## Features

✨ **CSM Copilot**
- Auto-detect industry from website
- Auto-calculate vacancy costs and recruiter rates using Gemini AI
- Generate professional QBR emails
- Create actionable CSM playbooks

📊 **ROI Analytics**
- Compare baseline vs. current period metrics
- Calculate hiring velocity value (cost of vacancy savings)
- Calculate recruiter efficiency value (time saved)
- Track adoption trends across key metrics

📈 **Interactive Dashboard**
- Real-time ROI calculations
- Customizable assumptions (time saved per action)
- Period-by-period metric tracking
- Visual adoption trend indicators

🎨 **Export & Sharing**
- Download scorecards as PNG images
- Copy AI-generated content to clipboard
- Professional client presentation ready

## Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The app will open at `http://localhost:3000`

## Configuration

### Gemini API Setup

To use the AI features (industry detection, playbook generation, etc.):

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/apikey)
2. Open `src/App.jsx` and add your API key to the `callGeminiAPI` function:

```javascript
const apiKey = "YOUR_GEMINI_API_KEY_HERE";
```

## Usage

1. **Enter Foundation Details**
   - Website URL (for auto-industry detection)
   - Industry classification
   - Recruiter hourly rate
   - Cost of vacancy per day
   - Handover/sales cost

2. **Set Time Assumptions**
   - Minutes saved per action (texts, offers, interviews, etc.)

3. **Compare Periods**
   - Baseline: Your current state metrics
   - Current: Post-implementation metrics

4. **Generate Insights**
   - QBR Email: Professional quarterly review summary
   - Playbook: 3 actionable CSM recommendations
   - Scorecard: Downloadable PNG for client presentations

## Key Metrics

- **Total Gross Value** = Hiring Velocity + Recruiter Efficiency
- **Hiring Velocity** = Days Saved per Hire × Cost of Vacancy
- **Recruiter Efficiency** = Hours Saved × Recruiter Rate
- **ROI %** = (Net Value / Sales Cost) × 100

## Tech Stack

- **React 18** - UI framework
- **Tailwind CSS** - Styling
- **Vite** - Build tool & dev server
- **Lucide React** - Icon library
- **Gemini API** - AI features
- **html2canvas** - PNG export

## Project Structure

```
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # React entry point
│   └── index.css        # Global styles
├── index.html           # HTML template
├── package.json         # Dependencies & scripts
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind configuration
└── postcss.config.js    # PostCSS configuration
```

## License

MIT

## Support

For issues or feature requests, please open an issue on the repository.
