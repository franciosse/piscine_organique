// lib/security/sanitizer.ts
import DOMPurify from 'dompurify';

// Configurations prédéfinies pour différents contextes
export const SANITIZE_CONFIGS = {
  // Configuration pour le contenu de cours/leçons
  LESSON_CONTENT: {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'i', 'b',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'img',
      'blockquote', 'code', 'pre',
      'table', 'tr', 'td', 'th', 'thead', 'tbody',
      'div', 'span'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class',
      'target', 'rel', 'width', 'height'
    ],
    FORBID_SCRIPTS: true,
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'iframe', 'style'],
    ALLOW_DATA_ATTR: false,
    FORCE_BODY: false,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    SANITIZE_DOM: true
  },

  // Configuration stricte pour les commentaires
  COMMENT: {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'i', 'b', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    FORBID_SCRIPTS: true,
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'iframe', 'img', 'style'],
    ALLOW_DATA_ATTR: false
  },

  // Configuration pour les titres/descriptions courtes
  BASIC_TEXT: {
    ALLOWED_TAGS: ['strong', 'em', 'u', 'i', 'b'],
    ALLOWED_ATTR: [],
    FORBID_SCRIPTS: true,
    STRIP_COMMENTS: true,
    ALLOW_DATA_ATTR: false
  }
};

// Type pour les clés de configuration
export type SanitizeConfigType = keyof typeof SANITIZE_CONFIGS;

// Fonction utilitaire principale
export function sanitizeHTML(html: string, configType: SanitizeConfigType = 'LESSON_CONTENT'): string {
  if (typeof window === 'undefined') {
    // Fallback pour le SSR - vous pouvez utiliser jsdom si nécessaire
    return html;
  }

  const config = SANITIZE_CONFIGS[configType];
  return DOMPurify.sanitize(html, config);
}