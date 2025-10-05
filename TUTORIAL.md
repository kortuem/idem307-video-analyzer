# Video Analyzer Tutorial

**A step-by-step guide for students using the AI Video Analyzer**

---

## Getting Started

### Step 1: Access the App

Visit the URL provided by your instructor: `[your-app-url-here]`

You'll see the Video Analyzer interface with a dark theme.

### Step 2: Authentication

You have two options:

**Option A: Use Instructor's Keyword** (Recommended for most students)
1. Get the access keyword from your instructor
2. Enter it in the text field at the top
3. Click **"Validate"**
4. You'll see:  Access granted via instructor key

**Option B: Use Your Own API Key** (For advanced users)
1. Get a free Gemini API key from [Google AI Studio](https://ai.google.dev/)
2. Enter your API key (starts with `AIzaSy...`)
3. Click **"Validate"**
4. You'll see:  Using your own API key

> **Note:** The system auto-detects which type you entered!

---

## Analyzing a Video

### Step 3: Upload Your Video

1. Click **"Choose File"** or drag and drop your video
2. Supported formats: MP4, WebM, MOV
3. **Recommended:** Videos under 30 seconds for best results
4. The video will load and you'll see a preview

### Step 4: Choose Analysis Settings

#### Select a Perspective

Choose what lens you want to analyze the video through:

- **Objective Description** - Factual, neutral description of what's visible
- **Urban Planning Analysis** - Infrastructure, circulation, spatial design
- **Social Dynamics Analysis** - Interactions, group behavior, community patterns
- **Safety Assessment** - Hazards, risks, protective measures
- **Accessibility Review** - Barriers, inclusive design, mobility challenges
- **Creative Fiction** - First-person narrative story (clearly marked as fiction)

#### Select Analysis Mode

- **Isolated Frames**
  - Each frame analyzed independently
  - Good for: Detailed analysis of specific moments
  - Output: Individual descriptions for each frame

- **Continuous Narrative**
  - Context flows between frames
  - Good for: Understanding how scenes evolve over time
  - Output: Flowing narrative that tells the story of the video

### Step 5: Start Analysis

1. Click **"Analyze Video"**
2. Watch the progress bar:
   - **0-30%:** Capturing frames from video
   - **30-90%:** AI analyzing each frame
   - **90-100%:** Generating summary
3. Analysis typically takes 30-60 seconds

> **Tip:** You can click **"Stop Analysis"** if needed

---

## Understanding Your Results

### Analysis Output

Once complete, you'll see:

#### Frame-by-Frame Analysis
- **Timestamp:** When this frame appears in the video
- **Change Intensity:** How different from previous frame (HIGH/MEDIUM/LOW)
- **Description:** AI-generated analysis from your chosen perspective

#### Comprehensive Narrative
- **Summary:** Overview of the entire video
- **Key Events:** Highlighted moments of significant change

#### Highlights
- Automatically detected important moments
- Shown with timestamps and reasons

### Step 6: Review and Re-analyze

**Want a different perspective?**
1. Select a different perspective from the dropdown
2. Click **"Analyze Video"** again
3. The app reuses captured frames (faster!)

**Switch modes:**
- Try the same video in both Isolated and Continuous modes
- Compare how the analysis differs

### Step 7: Download Your Analysis

1. Click **"Download Report"**
2. A `.txt` file downloads with:
   - All metadata (filename, duration, resolution)
   - Analysis mode used
   - Complete frame-by-frame results
   - Comprehensive narrative
   - Key highlights
3. Submit this file for your assignment (if required)

---

## Tips for Best Results

### Video Selection
 **Good videos:**
- Clear, well-lit scenes
- 5-30 seconds long
- Stable camera (not too shaky)
- Relevant to your analysis goal

L **Avoid:**
- Very dark or blurry videos
- Extremely long videos (>2 minutes)
- Videos with rapidly changing scenes

### Choosing Perspectives

**For Urban Observations:**
- Use "Urban Planning Analysis" or "Objective Description"

**For Social Research:**
- Try "Social Dynamics Analysis" or "Creative Fiction"

**For Safety Audits:**
- Use "Safety Assessment" or "Accessibility Review"

**Mix and Match:**
- Analyze the same video with multiple perspectives!
- Compare how different lenses reveal different insights

### Analysis Modes

**Use Isolated Mode when:**
- You want detailed analysis of specific moments
- Frames are very different from each other
- You need precise descriptions

**Use Continuous Mode when:**
- You want to understand narrative flow
- Tracking movement or changes over time
- Creating a story from the footage

---

## Troubleshooting

### "Session not established" error
- **Solution:** Clear your browser cookies and validate again
- Or try using your own API key instead

### Analysis fails or stops
- **Check:** Video format is supported (MP4, WebM, MOV)
- **Check:** Video isn't corrupted
- **Try:** Shorter video or different video

### "Server busy" message
- **Cause:** Too many students using at once
- **Solution:** Wait 2-3 minutes and try again
- **Alternative:** Use your own Gemini API key (bypasses limit)

### Download not working
- **Check:** You've completed an analysis first
- **Try:** Different browser if issues persist

### Results seem odd or incorrect
- **Remember:** AI analyzes only what's visible in frames
- **Tip:** Try different frame intervals or perspectives
- **Note:** Creative Fiction mode is explicitly fictional!

---

## Understanding the AI

### What the AI Can Do
-  Describe visible elements accurately
-  Identify objects, people, activities
-  Track changes between frames
-  Generate narrative summaries
-  Detect patterns and significant events

### What the AI Cannot Do
- L See things outside the frame
- L Know people's thoughts or motivations
- L Predict future events
- L Understand context outside the video
- L Make value judgments (except in fiction mode)

### Frame Sampling
- The app captures frames at regular intervals (not every frame)
- Typical: 5-10 frames per video
- Adaptive in continuous mode (more frames when changes detected)

---

## Privacy & Ethics

### Your Videos
- Videos are processed in your browser
- Frame data sent to AI for analysis only
- Nothing is permanently stored on servers
- Deleting analysis clears all data

### Responsible Use
- Only analyze videos you have permission to use
- Respect privacy of people in videos
- Creative Fiction mode: Always mark outputs as fictional
- Use analysis for educational purposes as intended

---

## Getting Help

### Still Having Issues?

1. **Check browser console** (F12 ’ Console tab) for errors
2. **Try a different browser** (Chrome, Firefox, Safari, Edge)
3. **Contact your instructor** with:
   - What you were trying to do
   - What error message you saw
   - Screenshot if possible

### Feedback & Suggestions

This tool is continuously improving! Share your experience with your instructor:
- What worked well?
- What was confusing?
- What features would help your work?

---

## Quick Reference Card

| Action | Steps |
|--------|-------|
| **Start Analysis** | Upload video ’ Choose perspective ’ Choose mode ’ Click "Analyze" |
| **Change Perspective** | Select new perspective ’ Click "Analyze" (reuses frames) |
| **Download Report** | After analysis completes ’ Click "Download Report" |
| **Clear & Restart** | Click "Clear" in API key banner ’ Start fresh |
| **Stop Analysis** | Click "Stop Analysis" during processing |

---

**Happy Analyzing! <¥(**

*Built with AI for educational video analysis | TU Delft IDEM307*
