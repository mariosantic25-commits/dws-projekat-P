import React from 'react'

export default function About() {
  return (
    <div 
      className="main-layout" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', // Centriramo naslov i karticu
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '50px 20px' 
      }}
    >
      <h1 
        className="section-title" 
        style={{ 
          fontSize: '2.5rem', 
          marginBottom: '30px',
          textAlign: 'center',
          color: '#333' // Malo tamnija boja za naslov
        }}
      >
        O nama
      </h1>
      
      <div 
        className="review-card" 
        style={{ 
          padding: '40px', 
          fontSize: '16px', 
          lineHeight: '1.8',
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 8px 20px rgba(0,0,0,0.06)', // Lijepa, moderna sjena
          textAlign: 'center' // Centriran tekst unutar kartice
        }}
      >
        <p style={{ marginBottom: '20px', color: '#444' }}>
          Dobrodošli na <strong style={{ color: '#111' }}>Thriftly</strong>, vašu pouzdanu platformu za kupovinu i prodaju second-hand stvari u Bosni i Hercegovini.
        </p>
        <p style={{ marginBottom: '20px', color: '#555' }}>
          Naša misija je smanjiti otpad i promovirati održivu modu i potrošnju. Vjerujemo da svaki predmet ima svoju priču i zaslužuje drugu šansu. Bilo da tražite rijetku vintage odjeću, knjige koje se više ne štampaju ili pristupačnu elektroniku, Thriftly vas spaja s prodavačima iz cijele države u samo par klikova.
        </p>
        <p style={{ marginBottom: '30px', color: '#555' }}>
          Platforma je kreirana s ciljem da bude jednostavna, sigurna i brza, omogućavajući vam da lako postavite svoje oglase ili pronađete savršen predmet.
        </p>
        <p style={{ fontWeight: 600, color: 'var(--green, #2e7d32)', fontSize: '1.1rem', margin: 0 }}>
          Pridružite se našoj zajednici danas i počnite istraživati hiljade jedinstvenih artikala!
        </p>
      </div>
    </div>
  )
}