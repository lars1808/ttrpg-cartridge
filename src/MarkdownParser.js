import { marked } from 'marked';
import yaml from 'js-yaml';

// Configure marked to be more permissive
marked.setOptions({
  breaks: true,
  gfm: true
});

export function parseCartridge(fileContent) {
  // Split the file into narrative and definitions
  const definitionsMatch = fileContent.match(/```definitions\n([\s\S]*?)```/);
  
  let narrative = fileContent;
  let definitions = {};
  
  if (definitionsMatch) {
    // Extract the YAML content
    const yamlContent = definitionsMatch[1];
    
    // Remove the definitions block from the narrative
    narrative = fileContent.replace(/```definitions\n[\s\S]*?```/, '').trim();
    
    // Parse the YAML
    try {
      definitions = yaml.load(yamlContent) || {};
    } catch (error) {
      console.error('Error parsing YAML:', error);
    }
  }
  
  return { narrative, definitions };
}

export function enhanceMarkdown(markdown, definitions) {
  // First, convert markdown to HTML
  let html = marked(markdown);
  
  // Find all [[Link]] patterns and make them interactive
  html = html.replace(/\[\[([^\]]+)\]\]/g, (match, term) => {
    const trimmedTerm = term.trim();
    
    // Check if this term exists in definitions
    if (definitions[trimmedTerm]) {
      // Make it a clickable link with special styling
      return `<span class="wiki-link" data-term="${trimmedTerm}">${trimmedTerm}</span>`;
    } else {
      // No definition found - render as plain text
      return trimmedTerm;
    }
  });
  
  // Find dice notation patterns and make them clickable
  // Matches patterns like: 1d6, 2d10+3, 3d8-1
  html = html.replace(/(\d+d\d+(?:[+-]\d+)?)/g, (match) => {
    return `<span class="dice-roll" data-formula="${match}">${match}</span>`;
  });
  
  return html;
}

export function extractTableOfContents(markdown) {
  const headings = [];
  const lines = markdown.split('\n');
  
  lines.forEach((line, index) => {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length; // Number of # symbols
      const text = match[2].trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      headings.push({
        level,
        text,
        id
      });
    }
  });
  
  return headings;
}

export function rollDice(formula) {
  // Parse formula like "2d6+3" or "1d20-1"
  const match = formula.match(/(\d+)d(\d+)([+-]\d+)?/);
  
  if (!match) return null;
  
  const numDice = parseInt(match[1]);
  const diceSize = parseInt(match[2]);
  const modifier = match[3] ? parseInt(match[3]) : 0;
  
  let total = modifier;
  const rolls = [];
  
  for (let i = 0; i < numDice; i++) {
    const roll = Math.floor(Math.random() * diceSize) + 1;
    rolls.push(roll);
    total += roll;
  }
  
  return {
    formula,
    rolls,
    modifier,
    total
  };
}