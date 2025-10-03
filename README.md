# Organizational Behavior & Development - Interactive Mind Map

An interactive, comprehensive website for the EMBA Organizational Behavior and Development course at Alexandria University. This platform provides a visual mind map of the entire course with nested navigation, search functionality, and detailed content exploration.

## 🎓 Course Information

- **Course**: Organizational Behavior and Development
- **Level**: EMBA (Executive MBA)
- **University**: Alexandria University
- **Instructor**: Dr. Ghada Adel Atteya
- **Date**: October 2025

## ✨ Features

### 1. Interactive Mind Map
- **Vis.js powered visualization** of the entire course structure
- Hierarchical layout showing relationships between parts, chapters, and concepts
- Color-coded by course parts for easy navigation
- Zoom and pan controls for exploration
- Export mind map as image

### 2. Nested Navigation System
- **Multi-level collapsible navigation** (parts → chapters → sections → concepts)
- Color-coded organization matching the 4 course parts
- Expand/collapse all functionality
- Visual hierarchy with indentation

### 3. Advanced Search
- **Full-text search** across all course content
- Search through chapters, sections, concepts, key takeaways
- Real-time search with debouncing
- Highlighted search results
- Context snippets showing matched content

### 4. Content Display
- **Detailed chapter views** with overview, key takeaways, and sections
- Nested sections with concepts, definitions, and examples
- Breadcrumb navigation
- Responsive layout for all devices

### 5. Additional Features
- **Bookmarks system** - Save important sections (stored in localStorage)
- **Print functionality** - Print-optimized views
- **Share capability** - Share content via Web Share API
- **Responsive design** - Works on desktop, tablet, and mobile
- **Dark theme** - Professional, eye-friendly design

## 📁 Project Structure

```
/
├── index.html                    # Main HTML file
├── css/
│   ├── style.css                # Main styles
│   └── responsive.css           # Responsive design
├── js/
│   ├── content-data.js          # Data loading and management
│   ├── mindmap.js               # Mind map visualization
│   ├── navigation.js            # Navigation system
│   ├── search.js                # Search functionality
│   └── main.js                  # Main application logic
├── data/
│   ├── course-content.json      # Master course data
│   └── extracted/               # Individual chapter JSONs
│       ├── chapter-3.json
│       ├── chapter-4.json
│       └── ...
├── converted_pdfs/              # Source PDF files
└── README.md                    # This file
```

## 🎨 Course Structure

### Part 1: The Field of Organizational Behavior
- Introduction to OB concepts
- Color: Blue (#3498db)

### Part 2: Understanding and Managing Individual Behavior
- Chapter 3: Individual Differences and Work Behavior
- Chapter 4: Perceptions, Attributions, and Emotions
- Chapter 5: Motivation
- Color: Green (#2ecc71)

### Part 3: Group Behavior and Interpersonal Influence
- Chapter 7: Evaluation, Feedback, and Rewards
- Chapter 9: Managing Individual Stress
- Chapter 10: Groups and Teams
- Color: Orange (#e67e22)

### Part 4: Organizational Processes
- Chapter 11: Managing Conflict and Negotiations
- Chapter 12: Power, Politics, and Empowerment
- Chapter 13: Communication
- Color: Purple (#9b59b6)

## 🚀 Getting Started

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Organizationa_behaviour_and_development
   ```

2. **Start a local web server**
   ```bash
   # Using Python 3
   python3 -m http.server 8000

   # Using Python 2
   python -m SimpleHTTPServer 8000

   # Using Node.js
   npx http-server -p 8000
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```

### GitHub Pages Deployment

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: OB Interactive Mind Map"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Enable GitHub Pages**
   - Go to repository Settings
   - Navigate to Pages section
   - Source: Deploy from branch
   - Branch: main
   - Folder: / (root)
   - Save

3. **Access your site**
   ```
   https://<username>.github.io/<repository-name>/
   ```

## 🛠️ Technology Stack

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with Grid and Flexbox
- **Vanilla JavaScript** - No frameworks, pure JS
- **Vis.js** - Network visualization library for mind maps
- **Font Awesome** - Icons
- **Google Fonts** - Inter and Merriweather fonts

## 📱 Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🎯 Usage Guide

### View Modes

1. **Mind Map View** - Focus on visual course structure
2. **Content View** - Navigation + detailed content
3. **Split View** - Mind map + content side by side

### Navigation

- **Click** on any node in the mind map to view content
- **Double-click** to zoom and focus on a specific node
- Use **navigation panel** to browse through chapters and sections
- Click **Expand All** / **Collapse All** to control navigation visibility

### Search

- Type in the search bar (minimum 2 characters)
- Results show across chapters, sections, and concepts
- Click any result to view the full content
- Search highlights matched terms

### Bookmarks

- Click bookmark icon to open bookmarks sidebar
- Bookmarks are saved locally in your browser
- Click any bookmark to navigate to that content
- Remove bookmarks with the × button

## 📊 Content Statistics

- **9 Chapters** across 4 course parts
- **100+ Key Concepts** and theories
- **317 Pages** of original course material
- **Interactive visualization** of all content relationships

## 🔄 Data Update Process

To update course content:

1. Extract new content to JSON format following the structure in `data/extracted/`
2. Update individual chapter files or add new ones
3. Run the compilation script (if automated) or manually update `data/course-content.json`
4. The website will automatically load the new content

## 📝 Content Structure (JSON Format)

```json
{
  "chapter": 10,
  "title": "Groups and Teams",
  "overview": "Chapter overview text...",
  "keyTakeaways": [
    "Key point 1...",
    "Key point 2..."
  ],
  "sections": [
    {
      "title": "Section Title",
      "level": 1,
      "content": "Section content...",
      "concepts": [
        {
          "name": "Concept Name",
          "definition": "Definition...",
          "examples": ["Example 1", "Example 2"]
        }
      ],
      "subsections": []
    }
  ],
  "totalPages": 31
}
```

## 🤝 Contributing

This is an educational project for Alexandria University EMBA program. For suggestions or improvements, please contact the course instructor.

## 📄 License

Educational use only. Course materials copyright © Alexandria University.

## 👥 Credits

- **Course Design**: Dr. Ghada Adel Atteya
- **Website Development**: Ahmed Mohamed Sabri (amsamms)
- **Textbooks**:
  - Konopaske et al. (2023) - Organizational Behavior, 12th Edition
  - Robbins & Judge (2024) - Organizational Behavior

## 📧 Contact

For questions about the course content or website, please contact:
- **Instructor**: Dr. Ghada Adel Atteya
- **Developer**: Ahmed Mohamed Sabri (ahmedsabri85@gmail.com)

---

**Last Updated**: October 2025
**Version**: 1.0.0

Made with ❤️ for Alexandria University EMBA students
