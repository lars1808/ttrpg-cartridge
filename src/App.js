import React, { useState, useEffect } from 'react';
import './App.css';
import { parseCartridge, enhanceMarkdown, extractTableOfContents, rollDice } from './MarkdownParser';

function App() {
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [narrative, setNarrative] = useState('');
  const [definitions, setDefinitions] = useState({});
  const [tableOfContents, setTableOfContents] = useState([]);
  const [contextCard, setContextCard] = useState(null);
  const [rollHistory, setRollHistory] = useState([]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.md')) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        setFileContent(content);
        
        // Parse the cartridge
        const { narrative, definitions } = parseCartridge(content);
        setNarrative(narrative);
        setDefinitions(definitions);
        
        // Extract TOC
        const toc = extractTableOfContents(narrative);
        setTableOfContents(toc);
      };
      reader.readAsText(file);
    } else {
      alert('Please upload a .md (Markdown) file');
    }
  };

  // Handle clicks on wiki links and dice rolls
  useEffect(() => {
    const handleClick = (event) => {
      // Handle wiki link clicks
      if (event.target.classList.contains('wiki-link')) {
        const term = event.target.dataset.term;
        if (definitions[term]) {
          setContextCard({ term, data: definitions[term] });
        }
      }
      
      // Handle dice roll clicks
      if (event.target.classList.contains('dice-roll')) {
        const formula = event.target.dataset.formula;
        const result = rollDice(formula);
        
        if (result) {
          // Add to roll history
          const timestamp = new Date().toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit'
          });
          
          setRollHistory(prev => [{
            ...result,
            timestamp,
            id: Date.now()
          }, ...prev]);
          
          // Show a toast notification (we'll style this next)
          showRollToast(result);
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [definitions]);

  const showRollToast = (result) => {
    // Simple alert for now - we'll make this prettier later
    alert(`🎲 ${result.formula}: ${result.total}`);
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="App">
      <div className="upload-container">
        <h1>🎮 TTRPG Cartridge Reader</h1>
        <label htmlFor="file-upload" className="upload-button">
          Load Cartridge (.md)
        </label>
        <input
          id="file-upload"
          type="file"
          accept=".md"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        {fileName && <p className="file-name">Loaded: {fileName}</p>}
      </div>

      {narrative ? (
        <div className="three-column-layout">
          {/* LEFT COLUMN - Table of Contents */}
          <aside className="left-column">
            <h2>Table of Contents</h2>
            {tableOfContents.length > 0 ? (
              <nav className="toc">
                {tableOfContents.map((heading, index) => (
                  <button
                    key={index}
                    className={`toc-item toc-level-${heading.level}`}
                    onClick={() => scrollToSection(heading.id)}
                  >
                    {heading.text}
                  </button>
                ))}
              </nav>
            ) : (
              <p className="toc-empty">No headings found</p>
            )}
          </aside>

          {/* CENTER COLUMN - Main Narrative */}
          <main className="center-column">
            <div 
              className="markdown-content"
              dangerouslySetInnerHTML={{ 
                __html: enhanceMarkdown(narrative, definitions) 
              }}
            />
          </main>

          {/* RIGHT COLUMN - Context Blade */}
          <aside className="right-column">
            <h2>Context Blade</h2>
            
            {contextCard ? (
              <div className="context-card">
                <h3>{contextCard.term}</h3>
                
                {contextCard.data.type === 'entity' && (
                  <div className="entity-stats">
                    {contextCard.data.stats?.map((stat, index) => (
                      <div key={index} className="stat-item">
                        <strong>{stat.label}:</strong> {stat.val || stat.formula}
                      </div>
                    ))}
                  </div>
                )}
                
                {contextCard.data.type === 'lore' && (
                  <div className="lore-content">
                    <p>{contextCard.data.desc}</p>
                    {contextCard.data.jump && (
                      <button 
                        className="jump-button"
                        onClick={() => scrollToSection(contextCard.data.jump.replace('#', ''))}
                      >
                        📖 Read More
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="context-empty">Click on a highlighted term to see details</p>
            )}
            
            <div className="roll-history">
              <h3>Roll History</h3>
              {rollHistory.length > 0 ? (
                <div className="roll-list">
                  {rollHistory.map((roll) => (
                    <div key={roll.id} className="roll-item">
                      <span className="roll-formula">🎲 {roll.formula}</span>
                      <span className="roll-result">{roll.total}</span>
                      <span className="roll-time">{roll.timestamp}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="roll-empty">No rolls yet</p>
              )}
            </div>
          </aside>
        </div>
      ) : (
        <div className="welcome-message">
          <p>📜 Upload a .md file to begin your adventure</p>
        </div>
      )}
    </div>
  );
}

export default App;