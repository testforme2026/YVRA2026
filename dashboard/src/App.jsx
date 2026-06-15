import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  MapPin, 
  Phone, 
  Video, 
  DollarSign, 
  Lock, 
  LogOut, 
  Settings, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Eye, 
  Layout, 
  Save, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || (window.location.origin.includes('5173') 
  ? 'http://localhost:3000' 
  : '');

const getColorHex = (color) => {
  if (!color) return 'transparent';
  const name = color.trim().toLowerCase();
  const map = {
    'black': '#000000',
    'white': '#ffffff',
    'pink': '#ffc0cb',
    'cream': '#fffdd0',
    'rose': '#ff007f',
    'red': '#ff0000',
    'blue': '#0000ff',
    'green': '#008000',
    'olive': '#808000',
    'navy': '#000080',
    'gold': '#ffd700',
    'silver': '#c0c0c0',
    'gray': '#808080',
    'grey': '#808080',
    'brown': '#a52a2a',
    'yellow': '#ffff00',
    'purple': '#800080',
    'orange': '#ffa500'
  };
  return map[name] || name;
};

function App() {
  // Navigation & Auth States
  const [view, setView] = useState('storefront'); // 'storefront' | 'login' | 'admin'
  const [adminTab, setAdminTab] = useState('products'); // 'products' | 'settings'
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Core Data States
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState({
    address: 'Room A-428, 4th floor, Times City, Times Mall, ရန်ကုန်မြို့',
    phone: '+95 9 431 61291',
    tiktok: 'tiktok.com/@yvra.official7',
    greetings: 'မင်္ဂလာပါရှင်။ YVRA Online Store မှ ကြိုဆိုပါတယ်။',
    payment: 'ငွေပေးချေမှုကို KBZPay, WavePay သို့မဟုတ် COD ဖြင့် ချေနိုင်ပါတယ်ရှင်။',
    tagline: 'YVRA COLLECTION / SUMMER 2026',
    aboutText: '',
    contactText: ''
  });
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  // UI/Loading States
  const [loading, setLoading] = useState(true);
  const [notify, setNotify] = useState({ show: false, message: '', type: 'success' });
  const [selectedProduct, setSelectedProduct] = useState(null); // For detail view modal

  // Admin Form States
  const [productForm, setProductForm] = useState({
    id: '',
    name: '',
    price: '',
    stock: '',
    description: '',
    imageUrl: '',
    variants: [],
    featured: false
  });
  const [showProductModal, setShowProductModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const prodRes = await fetch(`${API_BASE}/api/v1/products?t=${Date.now()}`);
      const prodData = await prodRes.json();
      setProducts(prodData);

      const setRes = await fetch(`${API_BASE}/api/v1/settings?t=${Date.now()}`);
      const setData = await setRes.json();
      setSettings(setData);
    } catch (error) {
      console.error('Error fetching data from API:', error);
      showNotification('Failed to load data from backend. Make sure the server is running.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotify({ show: true, message, type });
    setTimeout(() => {
      setNotify({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  // Auth Handlers
  const handleLogin = (e) => {
    e.preventDefault();
    if (loginEmail === 'admin@yvra.com' && loginPassword === 'yvra2025') {
      setIsLoggedIn(true);
      setView('admin');
      setAuthError('');
      setLoginPassword('');
      showNotification('Successfully logged in as Admin!');
    } else {
      setAuthError('Invalid email or password.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setView('storefront');
    showNotification('Logged out successfully.');
  };

  // Products CRUD Handlers
  const openAddModal = () => {
    setProductForm({
      id: '',
      name: '',
      price: '',
      stock: '',
      description: '',
      imageUrl: '',
      variants: [],
      featured: false
    });
    setIsEditMode(false);
    setShowProductModal(true);
  };

  const openEditModal = (product) => {
    setProductForm({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      description: product.description || '',
      imageUrl: product.imageUrl || '',
      variants: product.variants || [],
      featured: product.featured || false
    });
    setIsEditMode(true);
    setShowProductModal(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) {
      showNotification('Please fill in name and price.', 'error');
      return;
    }

    // Sum variants stock if present
    const finalStock = productForm.variants && productForm.variants.length > 0
      ? productForm.variants.reduce((sum, v) => sum + Number(v.stock || 0), 0)
      : Number(productForm.stock || 0);

    const payload = {
      ...productForm,
      stock: finalStock
    };

    try {
      const method = isEditMode ? 'PUT' : 'POST';
      const url = isEditMode 
        ? `${API_BASE}/api/v1/products/${productForm.id}` 
        : `${API_BASE}/api/v1/products`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('API request failed');

      showNotification(
        isEditMode ? 'Product updated successfully!' : 'Product added successfully!'
      );
      setShowProductModal(false);
      fetchData();
    } catch (error) {
      console.error('CRUD Error:', error);
      showNotification('Failed to save product details.', 'error');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/v1/products/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('API request failed');

      showNotification('Product deleted successfully.');
      fetchData();
    } catch (error) {
      console.error('CRUD Delete Error:', error);
      showNotification('Failed to delete product.', 'error');
    }
  };

  // Settings Save Handler
  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/api/v1/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (!response.ok) throw new Error('API request failed');

      showNotification('Store settings and Chatbot replies updated!');
    } catch (error) {
      console.error('Settings Update Error:', error);
      showNotification('Failed to save store configurations.', 'error');
    }
  };

  const featuredProduct = products.find(p => p.featured && p.stock > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
      
      {/* Decorative Fixed background petals */}
      <div className="floral-accent" style={{ position: 'fixed', top: '15vh', left: '-20px', width: '80px', height: '80px', transform: 'rotate(25deg)', opacity: 0.12, zIndex: -1 }} />
      <div className="floral-accent" style={{ position: 'fixed', top: '65vh', right: '-30px', width: '100px', height: '100px', transform: 'rotate(115deg)', opacity: 0.1, zIndex: -1 }} />
      <div className="floral-accent" style={{ position: 'fixed', bottom: '8vh', left: '2vw', width: '60px', height: '60px', transform: 'rotate(-45deg)', opacity: 0.08, zIndex: -1 }} />
      
      {/* Toast Notification Alert */}
      {notify.show && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          padding: '16px 24px',
          borderRadius: '8px',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          backgroundColor: notify.type === 'error' ? '#e63946' : '#2a3e2c',
          border: notify.type === 'error' ? '1px solid #ff4a5a' : '1px solid #4a6e4d',
          color: '#ffffff',
          fontWeight: 500,
          animation: 'fadeIn 0.3s ease'
        }}>
          {notify.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          <span>{notify.message}</span>
        </div>
      )}

      {/* HEADER NAVBAR */}
      <header className="glass" style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: '80px',
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid var(--color-border)'
      }}>
        <div className="container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%'
        }}>
          {/* Logo (Double-click is secret Admin gateway) */}
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', userSelect: 'none' }} 
            onClick={() => setView('storefront')}
            onDoubleClick={() => setView(isLoggedIn ? 'admin' : 'login')}
          >
            <img 
              src="/yvra.png" 
              alt="YVRA" 
              style={{ 
                height: '40px', 
                objectFit: 'contain'
              }} 
            />
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.8rem',
              fontWeight: 'bold',
              color: 'var(--color-primary)',
              letterSpacing: '1px'
            }}>YVRA</span>
          </div>

          {/* Dribbble Style Center Navigation Menu */}
          {!isMobile && view === 'storefront' && (
            <nav style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
              <a href="#collection" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main)', letterSpacing: '1px', textTransform: 'uppercase', position: 'relative' }}>Collection</a>
              <a href="#about" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }} onClick={(e) => { e.preventDefault(); setShowAboutModal(true); }}>About Boutique</a>
              <a href="#footer" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }} onClick={(e) => { e.preventDefault(); setShowContactModal(true); }}>Contact Us</a>
            </nav>
          )}

          {/* Nav Controls */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            
            {(view === 'admin' || view === 'login') && (
              <button 
                onClick={() => setView('storefront')}
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem' }}
              >
                <ShoppingBag size={16} />
                <span>View Storefront</span>
              </button>
            )}

            {isLoggedIn && (view === 'admin') && (
              <button 
                onClick={handleLogout}
                className="btn btn-danger"
                style={{ fontSize: '0.85rem', padding: '10px 16px' }}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, padding: '40px 0' }}>
        
        {/* CUSTOMER STOREFRONT VIEW */}
        {view === 'storefront' && (
          <div className="container">
            {/* Hero Section (Split-Screen Dribbble Fashion Layout) */}
            <section style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1.15fr 0.85fr',
              gap: '40px',
              alignItems: 'center',
              marginBottom: '80px',
              position: 'relative'
            }}>
              {/* Elegant background floral line-art watermark */}
              {!isMobile && (
                <div style={{
                  position: 'absolute',
                  right: '25%',
                  top: '-5%',
                  color: '#fce2e7',
                  opacity: 0.5,
                  zIndex: 0,
                  pointerEvents: 'none'
                }}>
                  <svg width="320" height="320" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8">
                    <path d="M10,95 Q40,65 70,35 Q80,25 90,15" />
                    <path d="M30,75 Q20,65 30,55 Q40,65 30,75 Z" fill="rgba(255, 209, 220, 0.08)" />
                    <path d="M50,55 Q40,45 50,35 Q60,45 50,55 Z" fill="rgba(255, 209, 220, 0.08)" />
                    <path d="M70,35 Q60,25 70,15 Q80,25 70,35 Z" fill="rgba(255, 209, 220, 0.08)" />
                    <path d="M35,70 Q45,60 35,50 Q25,60 35,70 Z" fill="rgba(255, 209, 220, 0.08)" />
                    <path d="M55,50 Q65,40 55,30 Q45,40 55,50 Z" fill="rgba(255, 209, 220, 0.08)" />
                  </svg>
                </div>
              )}

              {/* Left Column: Brand details */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 2, textAlign: isMobile ? 'center' : 'left' }}>
                <span style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  letterSpacing: '3px',
                  color: 'var(--color-primary)',
                  textTransform: 'uppercase',
                  marginBottom: '16px',
                  display: 'block'
                }}>— {settings.tagline || 'YVRA COLLECTION / SUMMER 2026'}</span>
                
                <h1 style={{
                  fontSize: isMobile ? '2.8rem' : '4.2rem',
                  lineHeight: '1.15',
                  fontFamily: 'var(--font-heading)',
                  color: '#421a22',
                  marginBottom: '24px',
                  fontWeight: '700'
                }}>
                  လှပဆန်းသစ်သော <br/>
                  <span style={{ color: 'var(--color-primary)' }}>အမျိုးသမီးဝတ်</span>အထည်များ
                </h1>
                
                <p style={{
                  fontSize: '1.15rem',
                  color: 'var(--color-text-muted)',
                  lineHeight: '1.7',
                  marginBottom: '40px',
                  maxWidth: '580px',
                  marginLeft: isMobile ? 'auto' : '0',
                  marginRight: isMobile ? 'auto' : '0'
                }}>
                  {settings.greetings}
                </p>

                {/* Shop Specs tags */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  maxWidth: '450px',
                  marginLeft: isMobile ? 'auto' : '0',
                  marginRight: isMobile ? 'auto' : '0',
                  width: '100%'
                }}>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`}
                    target="_blank" 
                    rel="noreferrer"
                    className="glass" 
                    style={{
                      padding: '14px 20px',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'all 0.25s ease',
                      textDecoration: 'none',
                      border: '1px solid var(--color-border)',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateX(6px)';
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                      e.currentTarget.style.backgroundColor = 'var(--color-accent-dim)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.85)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(214, 91, 124, 0.1)', color: 'var(--color-primary)' }}>
                      <MapPin size={16} />
                    </div>
                    <span style={{ fontSize: '0.88rem', color: 'var(--color-text-main)', fontWeight: 500, textAlign: 'left' }}>{settings.address}</span>
                  </a>

                  <a 
                    href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                    className="glass" 
                    style={{
                      padding: '14px 20px',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'all 0.25s ease',
                      textDecoration: 'none',
                      border: '1px solid var(--color-border)',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateX(6px)';
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                      e.currentTarget.style.backgroundColor = 'var(--color-accent-dim)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.85)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(214, 91, 124, 0.1)', color: 'var(--color-primary)' }}>
                      <Phone size={16} />
                    </div>
                    <span style={{ fontSize: '0.88rem', color: 'var(--color-text-main)', fontWeight: 500, textAlign: 'left' }}>{settings.phone}</span>
                  </a>

                  {settings.tiktok && (
                    <a 
                      href={settings.tiktok.startsWith('http') ? settings.tiktok : `https://${settings.tiktok}`}
                      target="_blank"
                      rel="noreferrer"
                      className="glass" 
                      style={{
                        padding: '14px 20px',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'all 0.25s ease',
                        textDecoration: 'none',
                        border: '1px solid var(--color-border)',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateX(6px)';
                        e.currentTarget.style.borderColor = 'var(--color-primary)';
                        e.currentTarget.style.backgroundColor = 'var(--color-accent-dim)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.borderColor = 'var(--color-border)';
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.85)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(214, 91, 124, 0.1)', color: 'var(--color-primary)' }}>
                        <Video size={16} />
                      </div>
                      <span style={{ fontSize: '0.88rem', color: 'var(--color-text-main)', fontWeight: 500, textAlign: 'left' }}>{settings.tiktok}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Right Column: Hero Visual Frame */}
              {!isMobile && (
                <div style={{ position: 'relative', width: '100%', height: '560px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* Background decorative flower shapes */}
                  <div className="floral-accent" style={{ top: '-40px', right: '-20px', width: '140px', height: '140px', transform: 'rotate(15deg)', opacity: 0.18 }} />
                  <div className="floral-accent" style={{ bottom: '-30px', left: '-50px', width: '100px', height: '100px', transform: 'rotate(-45deg)', opacity: 0.12 }} />
                  
                  {/* Visual border frame offset */}
                  <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    width: 'calc(100% - 20px)',
                    height: 'calc(100% - 20px)',
                    border: '2px solid var(--color-primary)',
                    borderRadius: 'var(--radius-lg)',
                    zIndex: 0
                  }} />

                  {/* Main Visual Image container */}
                  <div 
                    onClick={() => featuredProduct && setSelectedProduct(featuredProduct)}
                    style={{
                      position: 'relative',
                      width: 'calc(100% - 20px)',
                      height: 'calc(100% - 20px)',
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow-lg)',
                      backgroundColor: 'var(--color-accent)',
                      marginRight: '20px',
                      marginBottom: '20px',
                      zIndex: 1,
                      cursor: featuredProduct ? 'pointer' : 'default'
                    }}
                  >
                    <img 
                      src={featuredProduct ? featuredProduct.imageUrl : "/hero_fashion_model.png"} 
                      alt={featuredProduct ? featuredProduct.name : "YVRA Blossom Fashion Model"} 
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: 'contrast(1.02) brightness(0.98)',
                        transition: 'transform 0.5s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    />
                    {/* Decorative badge overlay */}
                    <div style={{
                      position: 'absolute',
                      bottom: '24px',
                      left: '24px',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid var(--color-border)',
                      padding: '12px 24px',
                      borderRadius: 'var(--radius-sm)',
                      boxShadow: 'var(--shadow-md)',
                      transition: 'transform 0.25s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (featuredProduct) e.currentTarget.style.transform = 'translateY(-3px)';
                    }}
                    onMouseLeave={(e) => {
                      if (featuredProduct) e.currentTarget.style.transform = 'translateY(0)';
                    }}
                    >
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>
                        {featuredProduct ? featuredProduct.name : "YVRA Blossom"}
                      </span>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginTop: '2px' }}>
                        {featuredProduct ? `${featuredProduct.price.toLocaleString()} MMK (Featured)` : "Premium Collection"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Elegant Floral Divider */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '50px 0', color: 'var(--color-primary)', opacity: 0.85 }}>
              <div style={{ height: '1px', flex: 1, background: 'linear-gradient(to right, transparent, var(--color-border), var(--color-primary))' }} />
              <svg width="120" height="30" viewBox="0 0 120 30" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ margin: '0 20px' }}>
                <circle cx="60" cy="15" r="3" fill="currentColor" />
                <path d="M60,11 C58,6 52,6 52,11 C52,16 60,15 60,15 C60,15 68,16 68,11 C68,6 62,6 60,11 Z" />
                <path d="M60,19 C58,24 52,24 52,19 C52,14 60,15 60,15 C60,15 68,14 68,19 C68,24 62,24 60,19 Z" />
                <path d="M56,15 C51,13 51,7 56,7 C61,7 60,15 60,15 C60,15 59,23 54,23 C49,23 51,17 56,15 Z" />
                <path d="M64,15 C69,13 69,7 64,7 C59,7 60,15 60,15 C60,15 61,23 66,23 C71,23 69,17 64,15 Z" />
                <path d="M45,15 C35,10 20,20 10,15" strokeDasharray="3 3" />
                <path d="M30,12 C28,8 24,10 26,13 Z" fill="currentColor" />
                <path d="M20,17 C18,13 14,15 16,18 Z" fill="currentColor" />
                <path d="M75,15 C85,10 100,20 110,15" strokeDasharray="3 3" />
                <path d="M90,12 C92,8 96,10 94,13 Z" fill="currentColor" />
                <path d="M100,17 C102,13 106,15 104,18 Z" fill="currentColor" />
              </svg>
              <div style={{ height: '1px', flex: 1, background: 'linear-gradient(to left, transparent, var(--color-border), var(--color-primary))' }} />
            </div>

            {/* Products Showcase Title */}
            <div id="collection" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
              <h2 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-heading)' }}>New Collection</h2>
              <span style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.95rem' }}>{products.length} Items Available</span>
            </div>

            {/* Products List Grid */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '100px 0', fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>
                Loading collection...
              </div>
            ) : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '100px 0', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-muted)' }}>
                No products found in the catalog. Open the admin panel to seed or add items.
              </div>
            ) : (
              <div className="grid grid-cols-3">
                {products.map((product) => (
                  <div 
                    key={product.id} 
                    className="glass"
                    style={{
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                      cursor: 'pointer',
                      border: '1px solid var(--color-border)',
                      position: 'relative',
                      backgroundColor: 'var(--color-bg-card)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                    onClick={() => setSelectedProduct(product)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px)';
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                      const img = e.currentTarget.querySelector('.card-image');
                      if (img) img.style.transform = 'scale(1.05)';
                      const fl = e.currentTarget.querySelector('.card-flower');
                      if (fl) fl.style.transform = 'rotate(90deg) scale(1.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                      const img = e.currentTarget.querySelector('.card-image');
                      if (img) img.style.transform = 'scale(1)';
                      const fl = e.currentTarget.querySelector('.card-flower');
                      if (fl) fl.style.transform = 'rotate(0deg) scale(1)';
                    }}
                  >
                    {/* Corner Cherry Blossom Overlay */}
                    <div className="card-flower" style={{
                      position: 'absolute',
                      top: '16px',
                      left: '16px',
                      color: 'var(--color-primary)',
                      opacity: 0.18,
                      zIndex: 5,
                      transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                      <svg width="24" height="24" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6">
                        <circle cx="50" cy="50" r="8" fill="currentColor" />
                        <path fill="currentColor" d="M50,20 C42,10 32,15 34,25 C36,35 50,45 50,45 C50,45 64,35 66,25 C68,15 58,10 50,20 Z" />
                        <path fill="currentColor" d="M50,80 C42,90 32,85 34,75 C36,65 50,55 50,55 C50,55 64,65 66,75 C68,85 58,90 50,80 Z" />
                        <path fill="currentColor" d="M20,50 C10,42 15,32 25,34 C35,36 45,50 45,50 C45,50 35,64 25,66 C15,68 10,58 20,50 Z" />
                        <path fill="currentColor" d="M80,50 C90,42 85,32 75,34 C65,36 55,50 55,50 C55,50 65,64 75,66 C85,68 90,58 80,50 Z" />
                      </svg>
                    </div>

                    {/* Image Box */}
                    <div style={{ height: '360px', width: '100%', overflow: 'hidden', backgroundColor: '#fff', position: 'relative' }}>
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="card-image"
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                          transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                      />
                      {product.stock === 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '16px',
                          right: '16px',
                          backgroundColor: '#f25f5c',
                          color: '#ffffff',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          letterSpacing: '1px'
                        }}>SOLD OUT</div>
                      )}
                    </div>
                    {/* Card Body */}
                    <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>{product.name}</h3>
                      <p style={{
                        fontSize: '0.88rem',
                        color: 'var(--color-text-muted)',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        marginBottom: '14px',
                        flex: 1,
                        lineHeight: '1.5'
                      }}>
                        {product.description}
                      </p>

                      {/* Storefront Variant Pills */}
                      {product.variants && product.variants.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', borderTop: '1px solid #fef5f7', paddingTop: '10px' }}>
                          {(() => {
                            const colors = [...new Set(product.variants.map(v => v.color).filter(Boolean))];
                            const sizes = [...new Set(product.variants.map(v => v.size).filter(Boolean))];
                            return (
                              <>
                                {colors.length > 0 && (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Colors:</span>
                                    {colors.map((c, idx) => (
                                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                        <div style={{
                                          width: '12px',
                                          height: '12px',
                                          borderRadius: '50%',
                                          backgroundColor: getColorHex(c),
                                          border: '1px solid rgba(0,0,0,0.15)',
                                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                        }} />
                                        <span style={{ fontSize: '0.58rem', color: 'var(--color-text-muted)', fontWeight: 500, lineHeight: 1 }}>{c}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {sizes.length > 0 && (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Sizes:</span>
                                    {sizes.map((s, idx) => (
                                      <span key={idx} style={{ fontSize: '0.7rem', backgroundColor: '#ffffff', color: 'var(--color-text-main)', border: '1px solid var(--color-border)', padding: '1px 6px', borderRadius: '10px', fontWeight: 500 }}>
                                        {s}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid #fef5f7', paddingTop: '12px' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-primary)' }}>
                          {product.price.toLocaleString()} MMK
                        </span>
                        <span style={{ fontSize: '0.82rem', color: product.stock > 0 ? '#4a6e4d' : '#f25f5c', fontWeight: 600 }}>
                          {product.stock > 0 ? `Stock: ${product.stock}` : 'Out of Stock'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ADMIN LOGIN VIEW */}
        {view === 'login' && (
          <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div className="glass" style={{
              width: '100%',
              maxWidth: '450px',
              padding: '40px',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-accent-dim)',
                  border: '1px solid var(--color-primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary)',
                  marginBottom: '16px'
                }}>
                  <Lock size={28} />
                </div>
                <h2>Admin Login</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>
                  Enter credentials to access catalog controls
                </p>
              </div>

              {authError && (
                <div style={{
                  padding: '12px',
                  backgroundColor: 'rgba(230,57,70,0.1)',
                  border: '1px solid #e63946',
                  borderRadius: '4px',
                  color: '#e63946',
                  fontSize: '0.9rem',
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>
                  {authError}
                </div>
              )}

              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin@yvra.com"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Password</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: '10px' }}
                >
                  Sign In
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ADMIN CONSOLE DASHBOARD VIEW */}
        {view === 'admin' && isLoggedIn && (
          <div className="container">
            <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
              
              {/* Dashboard Navigation Sidebar */}
              <aside className="glass" style={{
                width: '260px',
                borderRadius: 'var(--radius-md)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ padding: '0 8px 16px 8px', borderBottom: '1px solid var(--color-border)', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--color-primary)' }}>Control Console</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>admin@yvra.com</span>
                </div>

                <button 
                  onClick={() => setAdminTab('products')}
                  className="btn"
                  style={{
                    justifyContent: 'flex-start',
                    backgroundColor: adminTab === 'products' ? 'var(--color-accent-dim)' : 'transparent',
                    border: '1px solid',
                    borderColor: adminTab === 'products' ? 'var(--color-primary)' : 'transparent',
                    color: adminTab === 'products' ? 'var(--color-primary)' : 'var(--color-text-main)',
                    width: '100%'
                  }}
                >
                  <Layout size={18} />
                  <span>Manage Products</span>
                </button>

                <button 
                  onClick={() => setAdminTab('settings')}
                  className="btn"
                  style={{
                    justifyContent: 'flex-start',
                    backgroundColor: adminTab === 'settings' ? 'var(--color-accent-dim)' : 'transparent',
                    border: '1px solid',
                    borderColor: adminTab === 'settings' ? 'var(--color-primary)' : 'transparent',
                    color: adminTab === 'settings' ? 'var(--color-primary)' : 'var(--color-text-main)',
                    width: '100%'
                  }}
                >
                  <Settings size={18} />
                  <span>Shop Settings</span>
                </button>
              </aside>

              {/* Dashboard Panel Viewport */}
              <section style={{ flex: 1 }}>
                
                {/* 1. Manage Products Tab */}
                {adminTab === 'products' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <h2>Products Inventory</h2>
                      <button onClick={openAddModal} className="btn btn-primary">
                        <Plus size={18} />
                        <span>Add New Product</span>
                      </button>
                    </div>

                    {loading ? (
                      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
                        Refreshing products catalog...
                      </div>
                    ) : products.length === 0 ? (
                      <div className="glass" style={{ padding: '60px', textAlign: 'center', borderRadius: 'var(--radius-md)' }}>
                        <p style={{ color: 'var(--color-text-muted)' }}>No products in Firestore. Click "Add New Product" to configure catalog.</p>
                      </div>
                    ) : (
                      <div className="glass" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ backgroundColor: 'var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
                              <th style={{ padding: '16px 20px', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Image</th>
                              <th style={{ padding: '16px 20px', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Name</th>
                              <th style={{ padding: '16px 20px', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Price</th>
                              <th style={{ padding: '16px 20px', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Stock</th>
                              <th style={{ padding: '16px 20px', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', textAlign: 'right' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {products.map((product) => (
                              <tr key={product.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '16px 20px' }}>
                                  <img 
                                    src={product.imageUrl} 
                                    alt={product.name} 
                                    style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                                  />
                                </td>
                                <td style={{ padding: '16px 20px', fontWeight: 500 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span>{product.name}</span>
                                    {product.featured && (
                                      <span style={{ 
                                        backgroundColor: 'var(--color-primary)', 
                                        color: '#ffffff', 
                                        fontSize: '0.68rem', 
                                        fontWeight: 'bold', 
                                        padding: '2px 8px', 
                                        borderRadius: '10px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '2px'
                                      }}>
                                        ★ Featured
                                      </span>
                                    )}
                                  </div>
                                  {product.variants && product.variants.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                                      {product.variants.map((v, idx) => (
                                        <span key={idx} style={{ fontSize: '0.72rem', backgroundColor: 'var(--color-accent-dim)', border: '1px solid var(--color-border)', padding: '2px 6px', borderRadius: '4px', color: 'var(--color-text-main)' }}>
                                          {v.color} / {v.size} ({v.stock})
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </td>
                                <td style={{ padding: '16px 20px', color: 'var(--color-primary)' }}>{product.price.toLocaleString()} MMK</td>
                                <td style={{ padding: '16px 20px' }}>
                                  <span style={{ 
                                    padding: '4px 8px', 
                                    borderRadius: '4px', 
                                    fontSize: '0.85rem',
                                    fontWeight: 500,
                                    backgroundColor: product.stock > 0 ? 'rgba(74,110,77,0.1)' : 'rgba(230,57,70,0.1)',
                                    color: product.stock > 0 ? '#63c373' : '#e63946' 
                                  }}>
                                    {product.stock} left
                                  </span>
                                </td>
                                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                  <div style={{ display: 'inline-flex', gap: '8px' }}>
                                    <button 
                                      onClick={() => openEditModal(product)} 
                                      className="btn btn-secondary" 
                                      style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteProduct(product.id)} 
                                      className="btn btn-danger" 
                                      style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Shop Settings Tab */}
                {adminTab === 'settings' && (
                  <div>
                    <h2 style={{ marginBottom: '24px' }}>Shop & Chatbot Configuration</h2>
                    
                    <form onSubmit={handleSettingsSubmit} className="glass" style={{ padding: '40px', borderRadius: 'var(--radius-md)' }}>
                      <div className="form-group">
                        <label>Collection Tagline (စုစည်းမှု ခေါင်းစဉ်တို)</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={settings.tagline || ''}
                          onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                          placeholder="e.g. YVRA COLLECTION / SUMMER 2026"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Shop Address (ဆိုင်လိပ်စာ)</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={settings.address}
                          onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Contact Phone Number (ဆက်သွယ်ရန် ဖုန်း)</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={settings.phone}
                          onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>TikTok Profile link</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={settings.tiktok}
                          onChange={(e) => setSettings({ ...settings, tiktok: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label>About Boutique Text (ဆိုင်အကြောင်း ဖော်ပြချက်)</label>
                        <textarea 
                          className="form-input" 
                          value={settings.aboutText || ''}
                          onChange={(e) => setSettings({ ...settings, aboutText: e.target.value })}
                          placeholder="Boutique ဆိုင်အကြောင်း အကျဉ်းချုပ် ရေးသားရန်..."
                          style={{ minHeight: '100px' }}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Contact Us Text (ဆက်သွယ်ရန် ဖော်ပြချက်)</label>
                        <textarea 
                          className="form-input" 
                          value={settings.contactText || ''}
                          onChange={(e) => setSettings({ ...settings, contactText: e.target.value })}
                          placeholder="ဆက်သွယ်ရန် ဖုန်း၊ လိပ်စာနှင့် အခြားအချက်အလက်များ ဖော်ပြချက်..."
                          style={{ minHeight: '100px' }}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Greeting Prompt Context (ဆိုင်အကြောင်း မိတ်ဆက်စကား)</label>
                        <textarea 
                          className="form-input" 
                          value={settings.greetings}
                          onChange={(e) => setSettings({ ...settings, greetings: e.target.value })}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Payment Information Reply (ငွေချေမှုဆိုင်ရာ အချက်အလက်)</label>
                        <textarea 
                          className="form-input" 
                          value={settings.payment}
                          onChange={(e) => setSettings({ ...settings, payment: e.target.value })}
                          required
                        />
                      </div>

                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        style={{ marginTop: '10px' }}
                      >
                        <Save size={18} />
                        <span>Save Config & Sync Chatbot</span>
                      </button>
                    </form>
                  </div>
                )}

              </section>
            </div>
          </div>
        )}

      </main>

      {/* FOOTER AREA */}
      <footer className="glass" style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--color-border)',
        padding: '30px 0',
        backgroundColor: 'rgba(20,14,16,0.95)',
        textAlign: 'center'
      }}>
        <div className="container" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            &copy; 2026 YVRA Store. All rights reserved.
          </p>
          <p style={{ 
            color: 'var(--color-primary)', 
            fontSize: '0.85rem', 
            fontWeight: 500,
            letterSpacing: '0.5px' 
          }}>
            Powered by Vitalyx Medtech: vitalyxmedtech@protonmail.com
          </p>
        </div>
      </footer>

      {/* CUSTOMER DETAIL VIEW MODAL */}
      {selectedProduct && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(10, 8, 9, 0.85)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="glass" style={{
            width: '90%',
            maxWidth: '850px',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden',
            display: 'flex',
            position: 'relative'
          }}>
            <button 
              onClick={() => setSelectedProduct(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                border: 'none',
                background: 'rgba(20,14,16,0.6)',
                color: 'white',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10
              }}
            >
              <X size={20} />
            </button>

            <div className="grid grid-cols-2" style={{ gap: 0, width: '100%' }}>
              <div style={{ height: '500px', backgroundColor: '#231c1e' }}>
                <img 
                  src={selectedProduct.imageUrl} 
                  alt={selectedProduct.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '12px' }}>{selectedProduct.name}</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '18px', fontSize: '1rem' }}>
                  {selectedProduct.description}
                </p>
                
                {/* Customer Modal Variant Info */}
                {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '8px', letterSpacing: '0.8px', fontWeight: 600 }}>
                      Available Options
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto', paddingRight: '4px' }}>
                      {selectedProduct.variants.map((v, idx) => (
                        <div key={idx} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '6px 12px',
                          backgroundColor: 'var(--color-bg-deep)',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                          border: '1px solid var(--color-border)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '14px',
                              height: '14px',
                              borderRadius: '50%',
                              backgroundColor: getColorHex(v.color),
                              border: '1px solid rgba(0,0,0,0.15)',
                              flexShrink: 0
                            }} />
                            <span><strong>{v.color}</strong> / Size {v.size}</span>
                          </div>
                          <span style={{ color: v.stock > 0 ? 'var(--color-primary)' : '#e63946', fontWeight: 600 }}>
                            {v.stock > 0 ? `${v.stock} in stock` : 'Out of stock'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginBottom: '24px' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                    {selectedProduct.price.toLocaleString()} MMK
                  </span>
                  <span style={{ fontSize: '0.9rem', color: selectedProduct.stock > 0 ? '#63c373' : '#e63946', fontWeight: 600 }}>
                    {selectedProduct.stock > 0 ? `In Stock (${selectedProduct.stock} left)` : 'Out of Stock'}
                  </span>
                </div>
                <div>
                  <a 
                    href="https://m.me/your_facebook_page_id" 
                    target="_blank" 
                    rel="noreferrer"
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                  >
                    <ShoppingBag size={18} />
                    <span>Order via Messenger</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER ABOUT BOUTIQUE MODAL */}
      {showAboutModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(10, 8, 9, 0.85)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="glass shadow-lg" style={{
            width: '90%',
            maxWidth: '550px',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            position: 'relative',
            padding: '40px',
            textAlign: 'center',
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            animation: 'fadeIn 0.3s ease'
          }}>
            <button 
              onClick={() => setShowAboutModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                border: 'none',
                background: 'rgba(20,14,16,0.6)',
                color: 'white',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <img 
                src="/yvra.png" 
                alt="YVRA Logo" 
                style={{ 
                  height: '150px', 
                  objectFit: 'contain'
                }} 
              />
            </div>

            <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', color: '#421a22', marginBottom: '18px' }}>
              About YVRA Boutique
            </h2>
            
            <p style={{
              fontSize: '1.1rem',
              color: 'var(--color-text-main)',
              lineHeight: '1.7',
              marginBottom: '24px',
              textAlign: 'center',
              whiteSpace: 'pre-wrap'
            }}>
              {settings.aboutText || 'YVRA Boutique - Premium women garments and local designs.'}
            </p>

            <button onClick={() => setShowAboutModal(false)} className="btn btn-primary" style={{ width: '100%' }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* CUSTOMER CONTACT US MODAL */}
      {showContactModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(10, 8, 9, 0.85)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="glass shadow-lg" style={{
            width: '90%',
            maxWidth: '550px',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            position: 'relative',
            padding: '40px',
            textAlign: 'center',
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            animation: 'fadeIn 0.3s ease'
          }}>
            <button 
              onClick={() => setShowContactModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                border: 'none',
                background: 'rgba(20,14,16,0.6)',
                color: 'white',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <img 
                src="/yvra.png" 
                alt="YVRA Logo" 
                style={{ 
                  height: '150px', 
                  objectFit: 'contain'
                }} 
              />
            </div>

            <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', color: '#421a22', marginBottom: '18px' }}>
              Contact YVRA
            </h2>

            <p style={{
              fontSize: '1.05rem',
              color: 'var(--color-text-main)',
              lineHeight: '1.6',
              marginBottom: '24px',
              textAlign: 'center',
              whiteSpace: 'pre-wrap'
            }}>
              {settings.contactText || 'ဆိုင်သို့ အောက်ပါ ဖုန်း သို့မဟုတ် လိပ်စာများအတိုင်း ဆက်သွယ်စုံစမ်းနိုင်ပါတယ်ရှင်။'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`}
                target="_blank" 
                rel="noreferrer"
                className="btn btn-secondary"
                style={{ width: '100%', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
              >
                <MapPin size={16} />
                <span>Visit Store: {settings.address}</span>
              </a>

              <a 
                href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                className="btn btn-secondary"
                style={{ width: '100%', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
              >
                <Phone size={16} />
                <span>Call Us: {settings.phone}</span>
              </a>

              {settings.tiktok && (
                <a 
                  href={settings.tiktok.startsWith('http') ? settings.tiktok : `https://${settings.tiktok}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ width: '100%', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
                >
                  <Video size={16} />
                  <span>Follow us on TikTok</span>
                </a>
              )}
            </div>

            <button onClick={() => setShowContactModal(false)} className="btn btn-primary" style={{ width: '100%' }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* ADMIN PRODUCT EDIT/ADD DIALOG MODAL */}
      {showProductModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(10, 8, 9, 0.85)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(8px)'
        }}>
          <form onSubmit={handleProductSubmit} className="glass" style={{
            width: '95%',
            maxWidth: '550px',
            padding: '40px',
            borderRadius: 'var(--radius-md)',
            position: 'relative'
          }}>
            <button 
              type="button"
              onClick={() => setShowProductModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                border: 'none',
                background: 'transparent',
                color: 'var(--color-text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={24} />
            </button>

            <h2 style={{ marginBottom: '24px' }}>
              {isEditMode ? 'Modify Product' : 'Add Product to Catalog'}
            </h2>

            <div className="form-group">
              <label>Product Name</label>
              <input 
                type="text" 
                className="form-input" 
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                placeholder="e.g. Elegant Lace Dress"
                required
              />
            </div>

            <div className="grid grid-cols-2" style={{ gap: '16px' }}>
              <div className="form-group">
                <label>Price (MMK)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  placeholder="35000"
                  required
                />
              </div>
              <div className="form-group">
                <label>Stock Count</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={productForm.variants && productForm.variants.length > 0 
                    ? productForm.variants.reduce((sum, v) => sum + Number(v.stock || 0), 0)
                    : productForm.stock
                  }
                  onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                  placeholder="20"
                  disabled={productForm.variants && productForm.variants.length > 0}
                  required
                />
                {productForm.variants && productForm.variants.length > 0 && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-primary)' }}>
                    Calculated automatically from variant stocks.
                  </span>
                )}
              </div>
            </div>

            {/* Dynamic Variants Setup */}
            <div style={{ marginBottom: '20px', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.8px' }}>
                  Product Variants (Colors, Sizes, Stocks)
                </span>
                <button 
                  type="button" 
                  onClick={() => setProductForm({
                    ...productForm,
                    variants: [...(productForm.variants || []), { color: '', size: '', stock: 0 }]
                  })}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '6px' }}
                >
                  <Plus size={14} /> Add Variant
                </button>
              </div>

              {productForm.variants && productForm.variants.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '8px', marginBottom: '10px' }}>
                  {productForm.variants.map((v, index) => (
                    <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        placeholder="Color (e.g. Black)"
                        className="form-input"
                        style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                        value={v.color}
                        onChange={(e) => {
                          const newVariants = [...productForm.variants];
                          newVariants[index].color = e.target.value;
                          setProductForm({ ...productForm, variants: newVariants });
                        }}
                        required
                      />
                      <input 
                        type="text" 
                        placeholder="Size (e.g. M)"
                        className="form-input"
                        style={{ padding: '8px 12px', fontSize: '0.85rem', width: '90px' }}
                        value={v.size}
                        onChange={(e) => {
                          const newVariants = [...productForm.variants];
                          newVariants[index].size = e.target.value;
                          setProductForm({ ...productForm, variants: newVariants });
                        }}
                        required
                      />
                      <input 
                        type="number" 
                        placeholder="Stock"
                        className="form-input"
                        style={{ padding: '8px 12px', fontSize: '0.85rem', width: '90px' }}
                        value={v.stock}
                        onChange={(e) => {
                          const newVariants = [...productForm.variants];
                          newVariants[index].stock = parseInt(e.target.value) || 0;
                          setProductForm({ ...productForm, variants: newVariants });
                        }}
                        min="0"
                        required
                      />
                      <button 
                        type="button" 
                        onClick={() => {
                          const newVariants = productForm.variants.filter((_, idx) => idx !== index);
                          setProductForm({ ...productForm, variants: newVariants });
                        }}
                        className="btn btn-danger"
                        style={{ padding: '8px 10px', borderRadius: '6px' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '16px', textAlign: 'center', border: '1px dashed var(--color-border)', borderRadius: '8px', color: 'var(--color-text-muted)', fontSize: '0.82rem', marginBottom: '10px' }}>
                  No variants added yet.
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Product Image URL</label>
              <input 
                type="url" 
                className="form-input" 
                value={productForm.imageUrl}
                onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                placeholder="https://images.unsplash.com/..."
              />
            </div>

            <div className="form-group">
              <label>Description (Burmese)</label>
              <textarea 
                className="form-input" 
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                placeholder="ကုန်ပစ္စည်းအကြောင်း အသေးစိတ်ဖော်ပြချက်..."
              />
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', marginBottom: '20px' }}>
              <input 
                type="checkbox" 
                id="featured"
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                checked={productForm.featured}
                onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })}
              />
              <label htmlFor="featured" style={{ margin: 0, cursor: 'pointer', fontSize: '0.88rem', fontWeight: 500, textTransform: 'none', color: 'var(--color-text-main)' }}>
                Feature this product on landing page hero banner (In Stock items only)
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button 
                type="button" 
                onClick={() => setShowProductModal(false)} 
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
              >
                {isEditMode ? 'Update Product' : 'Add Product'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

export default App;
