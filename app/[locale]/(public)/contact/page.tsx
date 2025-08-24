"use client";
import { useState, useRef, useEffect } from 'react';
import { Send, Shield } from 'lucide-react';
import logger from '@/lib/logger/logger';


// Hook pour détecter si l'utilisateur est humain (temps de frappe)
function useHumanDetection() {
  const [isHuman, setIsHuman] = useState(false);
  const [keystrokes, setKeystrokes] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  const trackKeystroke = () => {
    if (!startTime) {
      setStartTime(Date.now());
    }
    setKeystrokes(prev => prev + 1);
    
    // Considérer comme humain après 5 keystrokes et au moins 2 secondes
    if (keystrokes > 5 && startTime && (Date.now() - startTime) > 2000) {
      setIsHuman(true);
    }
  };

  return { isHuman, trackKeystroke };
}

function ContactForm() {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    message: '',
    honeypot: '' // Champ invisible pour piéger les bots
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [rateLimit, setRateLimit] = useState(false);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaQuestion, setCaptchaQuestion] = useState({ question: '', answer: 0 });
  
  const { isHuman, trackKeystroke } = useHumanDetection();
  const submitAttempts = useRef(0);
  const lastSubmitTime = useRef(0);

  // Générer une question captcha simple
  useEffect(() => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setCaptchaQuestion({
      question: `Combien font ${num1} + ${num2} ?`,
      answer: num1 + num2
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Détecter les changements humains
    trackKeystroke();
    
    setFormData({ 
      ...formData, 
      [e.target.name]: e.target.value 
    });
  };

  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // 1. Honeypot check
    if (formData.honeypot) {
      errors.push('Bot détecté via honeypot');
    }
    
    // 2. Rate limiting
    const now = Date.now();
    if (now - lastSubmitTime.current < 30000) { // 30 secondes minimum entre envois
      errors.push('Trop de tentatives rapprochées');
      setRateLimit(true);
    }
    
    // 3. Human detection
    if (!isHuman) {
      errors.push('Comportement suspect détecté');
    }
    
    // 4. Captcha
    if (parseInt(captchaAnswer) !== captchaQuestion.answer) {
      errors.push('Réponse captcha incorrecte');
    }
    
    // 5. Contenu suspect
    const suspiciousPatterns = [
      /\b(viagra|casino|crypto|bitcoin|loan|debt)\b/i,
      /\b(click here|visit now|buy now)\b/i,
      /(https?:\/\/[^\s]+){3,}/, // Plus de 3 liens
      /(.)\1{10,}/, // Caractères répétés
    ];
    
    const allText = `${formData.name} ${formData.email} ${formData.message}`.toLowerCase();
    if (suspiciousPatterns.some(pattern => pattern.test(allText))) {
      errors.push('Contenu suspect détecté');
    }
    
    // 6. Validation basique
    if (!formData.name.trim() || formData.name.length < 2) {
      errors.push('Nom invalide');
    }
    
    if (!formData.email.includes('@') || formData.email.length < 5) {
      errors.push('Email invalide');
    }
    
    if (!formData.message.trim() || formData.message.length < 10) {
      errors.push('Message trop court (minimum 10 caractères)');
    }
    
    return { isValid: errors.length === 0, errors };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Increment attempt counter
    submitAttempts.current++;
    
    // Block after 3 failed attempts
    if (submitAttempts.current > 3) {
      setStatus('error');
      return;
    }
    
    const validation = validateForm();
    
    if (!validation.isValid) {
      console.warn('Tentative de spam bloquée:', validation.errors);
      setStatus('error');
      return;
    }
    
    setStatus('loading');
    lastSubmitTime.current = Date.now();
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          message: formData.message.trim(),
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          // Ne pas envoyer le honeypot
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur serveur');
      }

      setStatus('success');
      setFormData({ name: '', email: '', message: '', honeypot: '' });
      setCaptchaAnswer('');
      submitAttempts.current = 0; // Reset on success
      
      // Regénérer le captcha
      const num1 = Math.floor(Math.random() * 10) + 1;
      const num2 = Math.floor(Math.random() * 10) + 1;
      setCaptchaQuestion({
        question: `Combien font ${num1} + ${num2} ?`,
        answer: num1 + num2
      });
      
    } catch (error) {
      logger.error('Erreur envoi:' + error);
      setStatus('error');
    }
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Contactez-nous
        </h2>
        
        {/* Indicateur de sécurité */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
            <Shield className="w-4 h-4 mr-1" />
            Formulaire protégé contre le spam
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-lg p-8 space-y-6"
        >
          {/* Honeypot - Champ invisible pour les bots */}
          <input
            type="text"
            name="honeypot"
            value={formData.honeypot}
            onChange={handleChange}
            style={{ display: 'none' }}
            tabIndex={-1}
            autoComplete="off"
          />

          {/* Nom */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nom *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              minLength={2}
              maxLength={50}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              maxLength={100}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            />
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
              Message * <span className="text-xs text-gray-500">(minimum 10 caractères)</span>
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              value={formData.message}
              onChange={handleChange}
              required
              minLength={10}
              maxLength={1000}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            />
            <div className="text-xs text-gray-500 mt-1">
              {formData.message.length}/1000 caractères
            </div>
          </div>

          {/* Captcha Simple */}
          <div>
            <label htmlFor="captcha" className="block text-sm font-medium text-gray-700">
              Vérification anti-spam *
            </label>
            <div className="mt-1 flex items-center space-x-3">
              <span className="text-sm text-gray-600">{captchaQuestion.question}</span>
              <input
                id="captcha"
                type="number"
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                required
                className="w-20 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                placeholder="?"
              />
            </div>
          </div>

          {/* Indicateurs de sécurité */}
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex items-center">
              <span className={`w-2 h-2 rounded-full mr-2 ${isHuman ? 'bg-green-500' : 'bg-gray-300'}`} />
              Détection humaine: {isHuman ? 'Validée' : 'En cours...'}
            </div>
            {rateLimit && (
              <div className="text-red-500">
                ⚠️ Veuillez attendre avant de soumettre à nouveau
              </div>
            )}
          </div>

          {/* Bouton */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={status === 'loading' || rateLimit || !isHuman || parseInt(captchaAnswer) !== captchaQuestion.answer}
              className="inline-flex items-center px-6 py-3 text-white bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
            >
              {status === 'loading' ? 'Envoi...' : 'Envoyer le message'}
              <Send className="ml-2 h-5 w-5" />
            </button>
          </div>

          {/* Statut */}
          {status === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-center text-green-600">
                ✅ Message envoyé avec succès ! Nous vous répondrons rapidement.
              </p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-center text-red-600">
                ❌ Erreur lors de l'envoi. Vérifiez vos informations et réessayez.
              </p>
              {submitAttempts.current > 3 && (
                <p className="text-center text-red-500 text-sm mt-2">
                  Trop de tentatives. Contactez-nous directement par email.
                </p>
              )}
            </div>
          )}
        </form>

        {/* Contact alternatif */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            Vous pouvez aussi nous contacter directement à{' '}
            <a href="mailto:contact@piscineorganique.com" className="text-green-600 hover:text-green-700">
              contact@piscineorganique.com
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

export default ContactForm;