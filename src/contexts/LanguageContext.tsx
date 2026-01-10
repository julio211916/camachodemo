import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'es' | 'en' | 'pt' | 'ru';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  es: {
    // Navigation
    'nav.home': 'Inicio',
    'nav.about': 'Nosotros',
    'nav.services': 'Servicios',
    'nav.testimonials': 'Testimonios',
    'nav.appointments': 'Citas',
    'nav.locations': 'Ubicaciones',
    'nav.contact': 'Contacto',
    'nav.login': 'Iniciar Sesión',
    'nav.portal': 'Mi Portal',
    
    // Hero
    'hero.title': 'Sonrisas Perfectas',
    'hero.subtitle': 'con Tecnología de Vanguardia',
    'hero.description': 'Experiencia dental de primer nivel con los más altos estándares de calidad y atención personalizada.',
    'hero.cta': 'Agendar Cita',
    'hero.secondary': 'Conocer Más',
    
    // About
    'about.title': 'Sobre Nosotros',
    'about.subtitle': 'Excelencia en Odontología Digital',
    'about.description': 'En NovellDent combinamos la última tecnología con años de experiencia para brindarte el mejor cuidado dental.',
    
    // Services
    'services.title': 'Nuestros Servicios',
    'services.subtitle': 'Cuidado Dental Integral',
    'services.implants': 'Implantes Dentales',
    'services.orthodontics': 'Ortodoncia',
    'services.aesthetics': 'Estética Dental',
    'services.endodontics': 'Endodoncia',
    'services.periodontics': 'Periodoncia',
    'services.surgery': 'Cirugía Oral',
    
    // Appointments
    'appointments.title': 'Agendar Cita',
    'appointments.subtitle': 'Reserva tu consulta en línea',
    'appointments.name': 'Nombre completo',
    'appointments.email': 'Correo electrónico',
    'appointments.phone': 'Teléfono',
    'appointments.date': 'Fecha',
    'appointments.time': 'Hora',
    'appointments.service': 'Servicio',
    'appointments.location': 'Sucursal',
    'appointments.notes': 'Notas adicionales',
    'appointments.submit': 'Confirmar Cita',
    'appointments.referral': 'Código de referido (opcional)',
    'appointments.referralHint': '¡Obtén 5% de descuento con un código de referido!',
    
    // Referrals
    'referrals.title': 'Programa de Referidos',
    'referrals.subtitle': 'Gana descuentos por cada amigo',
    'referrals.yourCode': 'Tu código de referido',
    'referrals.share': 'Compartir código',
    'referrals.discount': '5% de descuento',
    'referrals.pending': 'Pendientes',
    'referrals.completed': 'Completados',
    'referrals.earned': 'Descuentos ganados',
    
    // Contact
    'contact.title': 'Contacto',
    'contact.subtitle': 'Estamos para ayudarte',
    'contact.message': 'Mensaje',
    'contact.send': 'Enviar Mensaje',
    
    // Footer
    'footer.rights': 'Todos los derechos reservados',
    'footer.privacy': 'Política de Privacidad',
    'footer.terms': 'Términos y Condiciones',
    
    // Auth
    'auth.login': 'Iniciar Sesión',
    'auth.register': 'Registrarse',
    'auth.email': 'Correo electrónico',
    'auth.password': 'Contraseña',
    'auth.fullName': 'Nombre completo',
    'auth.phone': 'Teléfono',
    'auth.continue': 'Continuar',
    'auth.createAccount': 'Crear cuenta',
    'auth.welcome': 'Bienvenido',
    'auth.accessPortal': 'Accede a tu portal dental',
    'auth.joinUs': 'Únete a NovellDent',
    'auth.patient': 'Paciente',
    'auth.doctor': 'Doctor',
    'auth.experience': 'Experiencia dental de primer nivel',
    
    // Common
    'common.loading': 'Cargando...',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.view': 'Ver',
    'common.search': 'Buscar',
    'common.filter': 'Filtrar',
    'common.export': 'Exportar',
    'common.print': 'Imprimir',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.services': 'Services',
    'nav.testimonials': 'Testimonials',
    'nav.appointments': 'Appointments',
    'nav.locations': 'Locations',
    'nav.contact': 'Contact',
    'nav.login': 'Login',
    'nav.portal': 'My Portal',
    
    // Hero
    'hero.title': 'Perfect Smiles',
    'hero.subtitle': 'with Cutting-Edge Technology',
    'hero.description': 'First-class dental experience with the highest quality standards and personalized care.',
    'hero.cta': 'Book Appointment',
    'hero.secondary': 'Learn More',
    
    // About
    'about.title': 'About Us',
    'about.subtitle': 'Excellence in Digital Dentistry',
    'about.description': 'At NovellDent we combine the latest technology with years of experience to provide you with the best dental care.',
    
    // Services
    'services.title': 'Our Services',
    'services.subtitle': 'Comprehensive Dental Care',
    'services.implants': 'Dental Implants',
    'services.orthodontics': 'Orthodontics',
    'services.aesthetics': 'Dental Aesthetics',
    'services.endodontics': 'Endodontics',
    'services.periodontics': 'Periodontics',
    'services.surgery': 'Oral Surgery',
    
    // Appointments
    'appointments.title': 'Book Appointment',
    'appointments.subtitle': 'Schedule your consultation online',
    'appointments.name': 'Full name',
    'appointments.email': 'Email',
    'appointments.phone': 'Phone',
    'appointments.date': 'Date',
    'appointments.time': 'Time',
    'appointments.service': 'Service',
    'appointments.location': 'Location',
    'appointments.notes': 'Additional notes',
    'appointments.submit': 'Confirm Appointment',
    'appointments.referral': 'Referral code (optional)',
    'appointments.referralHint': 'Get 5% off with a referral code!',
    
    // Referrals
    'referrals.title': 'Referral Program',
    'referrals.subtitle': 'Earn discounts for each friend',
    'referrals.yourCode': 'Your referral code',
    'referrals.share': 'Share code',
    'referrals.discount': '5% discount',
    'referrals.pending': 'Pending',
    'referrals.completed': 'Completed',
    'referrals.earned': 'Earned discounts',
    
    // Contact
    'contact.title': 'Contact',
    'contact.subtitle': 'We are here to help',
    'contact.message': 'Message',
    'contact.send': 'Send Message',
    
    // Footer
    'footer.rights': 'All rights reserved',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms and Conditions',
    
    // Auth
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.fullName': 'Full name',
    'auth.phone': 'Phone',
    'auth.continue': 'Continue',
    'auth.createAccount': 'Create account',
    'auth.welcome': 'Welcome',
    'auth.accessPortal': 'Access your dental portal',
    'auth.joinUs': 'Join NovellDent',
    'auth.patient': 'Patient',
    'auth.doctor': 'Doctor',
    'auth.experience': 'First-class dental experience',
    
    // Common
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.print': 'Print',
  },
  pt: {
    // Navigation
    'nav.home': 'Início',
    'nav.about': 'Sobre Nós',
    'nav.services': 'Serviços',
    'nav.testimonials': 'Depoimentos',
    'nav.appointments': 'Consultas',
    'nav.locations': 'Localizações',
    'nav.contact': 'Contato',
    'nav.login': 'Entrar',
    'nav.portal': 'Meu Portal',
    
    // Hero
    'hero.title': 'Sorrisos Perfeitos',
    'hero.subtitle': 'com Tecnologia de Ponta',
    'hero.description': 'Experiência odontológica de primeira classe com os mais altos padrões de qualidade e atendimento personalizado.',
    'hero.cta': 'Agendar Consulta',
    'hero.secondary': 'Saiba Mais',
    
    // About
    'about.title': 'Sobre Nós',
    'about.subtitle': 'Excelência em Odontologia Digital',
    'about.description': 'Na NovellDent combinamos a mais recente tecnologia com anos de experiência para oferecer o melhor cuidado dental.',
    
    // Services
    'services.title': 'Nossos Serviços',
    'services.subtitle': 'Cuidado Dental Completo',
    'services.implants': 'Implantes Dentários',
    'services.orthodontics': 'Ortodontia',
    'services.aesthetics': 'Estética Dental',
    'services.endodontics': 'Endodontia',
    'services.periodontics': 'Periodontia',
    'services.surgery': 'Cirurgia Oral',
    
    // Appointments
    'appointments.title': 'Agendar Consulta',
    'appointments.subtitle': 'Reserve sua consulta online',
    'appointments.name': 'Nome completo',
    'appointments.email': 'E-mail',
    'appointments.phone': 'Telefone',
    'appointments.date': 'Data',
    'appointments.time': 'Hora',
    'appointments.service': 'Serviço',
    'appointments.location': 'Localização',
    'appointments.notes': 'Notas adicionais',
    'appointments.submit': 'Confirmar Consulta',
    'appointments.referral': 'Código de indicação (opcional)',
    'appointments.referralHint': 'Ganhe 5% de desconto com um código de indicação!',
    
    // Referrals
    'referrals.title': 'Programa de Indicação',
    'referrals.subtitle': 'Ganhe descontos por cada amigo',
    'referrals.yourCode': 'Seu código de indicação',
    'referrals.share': 'Compartilhar código',
    'referrals.discount': '5% de desconto',
    'referrals.pending': 'Pendentes',
    'referrals.completed': 'Concluídos',
    'referrals.earned': 'Descontos ganhos',
    
    // Contact
    'contact.title': 'Contato',
    'contact.subtitle': 'Estamos aqui para ajudar',
    'contact.message': 'Mensagem',
    'contact.send': 'Enviar Mensagem',
    
    // Footer
    'footer.rights': 'Todos os direitos reservados',
    'footer.privacy': 'Política de Privacidade',
    'footer.terms': 'Termos e Condições',
    
    // Auth
    'auth.login': 'Entrar',
    'auth.register': 'Registrar',
    'auth.email': 'E-mail',
    'auth.password': 'Senha',
    'auth.fullName': 'Nome completo',
    'auth.phone': 'Telefone',
    'auth.continue': 'Continuar',
    'auth.createAccount': 'Criar conta',
    'auth.welcome': 'Bem-vindo',
    'auth.accessPortal': 'Acesse seu portal dental',
    'auth.joinUs': 'Junte-se à NovellDent',
    'auth.patient': 'Paciente',
    'auth.doctor': 'Médico',
    'auth.experience': 'Experiência dental de primeira classe',
    
    // Common
    'common.loading': 'Carregando...',
    'common.save': 'Salvar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Excluir',
    'common.edit': 'Editar',
    'common.view': 'Ver',
    'common.search': 'Buscar',
    'common.filter': 'Filtrar',
    'common.export': 'Exportar',
    'common.print': 'Imprimir',
  },
  ru: {
    // Navigation
    'nav.home': 'Главная',
    'nav.about': 'О Нас',
    'nav.services': 'Услуги',
    'nav.testimonials': 'Отзывы',
    'nav.appointments': 'Запись',
    'nav.locations': 'Адреса',
    'nav.contact': 'Контакты',
    'nav.login': 'Войти',
    'nav.portal': 'Мой Портал',
    
    // Hero
    'hero.title': 'Идеальные Улыбки',
    'hero.subtitle': 'с Передовыми Технологиями',
    'hero.description': 'Стоматологический опыт первого класса с высочайшими стандартами качества и персональным подходом.',
    'hero.cta': 'Записаться',
    'hero.secondary': 'Узнать Больше',
    
    // About
    'about.title': 'О Нас',
    'about.subtitle': 'Совершенство в Цифровой Стоматологии',
    'about.description': 'В NovellDent мы сочетаем новейшие технологии с многолетним опытом для лучшего стоматологического ухода.',
    
    // Services
    'services.title': 'Наши Услуги',
    'services.subtitle': 'Комплексная Стоматологическая Помощь',
    'services.implants': 'Зубные Импланты',
    'services.orthodontics': 'Ортодонтия',
    'services.aesthetics': 'Эстетическая Стоматология',
    'services.endodontics': 'Эндодонтия',
    'services.periodontics': 'Пародонтология',
    'services.surgery': 'Хирургия Полости Рта',
    
    // Appointments
    'appointments.title': 'Записаться на Прием',
    'appointments.subtitle': 'Запишитесь онлайн',
    'appointments.name': 'Полное имя',
    'appointments.email': 'Электронная почта',
    'appointments.phone': 'Телефон',
    'appointments.date': 'Дата',
    'appointments.time': 'Время',
    'appointments.service': 'Услуга',
    'appointments.location': 'Филиал',
    'appointments.notes': 'Дополнительные заметки',
    'appointments.submit': 'Подтвердить Запись',
    'appointments.referral': 'Реферальный код (необязательно)',
    'appointments.referralHint': 'Получите скидку 5% по реферальному коду!',
    
    // Referrals
    'referrals.title': 'Реферальная Программа',
    'referrals.subtitle': 'Получайте скидки за друзей',
    'referrals.yourCode': 'Ваш реферальный код',
    'referrals.share': 'Поделиться кодом',
    'referrals.discount': 'Скидка 5%',
    'referrals.pending': 'Ожидающие',
    'referrals.completed': 'Завершенные',
    'referrals.earned': 'Заработанные скидки',
    
    // Contact
    'contact.title': 'Контакты',
    'contact.subtitle': 'Мы здесь, чтобы помочь',
    'contact.message': 'Сообщение',
    'contact.send': 'Отправить',
    
    // Footer
    'footer.rights': 'Все права защищены',
    'footer.privacy': 'Политика Конфиденциальности',
    'footer.terms': 'Условия Использования',
    
    // Auth
    'auth.login': 'Войти',
    'auth.register': 'Регистрация',
    'auth.email': 'Электронная почта',
    'auth.password': 'Пароль',
    'auth.fullName': 'Полное имя',
    'auth.phone': 'Телефон',
    'auth.continue': 'Продолжить',
    'auth.createAccount': 'Создать аккаунт',
    'auth.welcome': 'Добро пожаловать',
    'auth.accessPortal': 'Войдите в свой портал',
    'auth.joinUs': 'Присоединяйтесь к NovellDent',
    'auth.patient': 'Пациент',
    'auth.doctor': 'Врач',
    'auth.experience': 'Стоматологический опыт первого класса',
    
    // Common
    'common.loading': 'Загрузка...',
    'common.save': 'Сохранить',
    'common.cancel': 'Отмена',
    'common.delete': 'Удалить',
    'common.edit': 'Редактировать',
    'common.view': 'Просмотр',
    'common.search': 'Поиск',
    'common.filter': 'Фильтр',
    'common.export': 'Экспорт',
    'common.print': 'Печать',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('es');

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language;
    if (saved && translations[saved]) {
      setLanguageState(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['es'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
