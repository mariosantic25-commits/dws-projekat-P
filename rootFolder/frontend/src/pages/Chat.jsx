import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import Spinner from '../components/common/Spinner.jsx'
import { api } from '../api/index.js'

export default function Chat() {
  const { id: activeConvoId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()

  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [users, setUsers] = useState([])
  const [products, setProducts] = useState([])
  
  const [loadingConvos, setLoadingConvos] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [newMessage, setNewMessage] = useState('')

  const messagesEndRef = useRef(null)
  // Ref kojim pratimo da li je korisnik sam poslao poruku (da samo tada forsira skrol)
  const shouldScrollRef = useRef(false)

  const isParticipant = (c) => 
    String(c.buyerId) === String(user?.id) || 
    String(c.sellerId) === String(user?.id) ||
    String(c.participant_one) === String(user?.id) || 
    String(c.participant_two) === String(user?.id)

  // 1. Inicijalno učitavanje konverzacija, korisnika i artikala
  useEffect(() => {
    if (!user) return

    async function fetchInitialData() {
      try {
        setLoadingConvos(true)
        const [allConvos, allUsers, allProducts] = await Promise.all([
          api.get('/conversations'),
          api.get('/users'),
          api.get('/products')
        ])

        const myConvos = allConvos.filter(isParticipant)
        myConvos.sort((a, b) => new Date(b.last_message_at || b.created_at) - new Date(a.last_message_at || a.created_at))

        setConversations(myConvos)
        setUsers(allUsers)
        setProducts(allProducts)
      } catch (err) {
        console.error('Greška pri učitavanju chata:', err)
      } finally {
        setLoadingConvos(false)
      }
    }

    fetchInitialData()
  }, [user])

  // 2. Polling (osvežavanje) poruka svake 3 sekunde - bez gubljenja poruka i bez stalnog skrolanja natrag
  useEffect(() => {
    if (!activeConvoId) {
      setMessages([])
      return
    }

    async function fetchMessages() {
      try {
        // Osiguravamo jako/moćno poređenje ID-a (podržava i brojeve i stringove iz json-servera)
        const data = await api.get('/messages')
        const filteredMessages = data.filter(m => String(m.conversationId) === String(activeConvoId))
        
        // Sortiramo poruke po vremenu kreiranja
        filteredMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

        setMessages(filteredMessages)

        // Označi nepročitane poruke kao pročitane
        const unread = filteredMessages.filter(m => String(m.senderId) !== String(user.id) && !m.is_read)
        if (unread.length > 0) {
          await Promise.all(unread.map(m => api.patch(`/messages/${m.id}`, { is_read: true })))
        }
      } catch (err) {
        console.error("Greška pri učitavanju poruka:", err)
      }
    }

    setLoadingMessages(true)
    // Prvo učitavanje odmah skrola na dno
    shouldScrollRef.current = true
    fetchMessages().then(() => setLoadingMessages(false))

    const interval = setInterval(() => {
      // Tokom automatskog osvežavanja NE želimo skrolati osim ako nismo na dnu, pa stavljamo false
      shouldScrollRef.current = false
      fetchMessages()
    }, 3000)

    return () => clearInterval(interval)
  }, [activeConvoId, user?.id])

  // 3. Kontrola skrola: Skrola samo pri prvom otvaranju chata ili kad korisnik pošalje poruku
  useEffect(() => {
    if (shouldScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Slanje poruke
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeConvoId) return

    const textToSend = newMessage.trim()
    setNewMessage('')

    try {
      // Forsiramo skrol nakon što se state ažurira našom porukom
      shouldScrollRef.current = true

      const createdMessage = await api.post('/messages', {
        conversationId: activeConvoId, // Čuva originalni format tipa (string/broj)
        senderId: user.id,
        body: textToSend,
        is_read: false,
        created_at: new Date().toISOString()
      })

      await api.patch(`/conversations/${activeConvoId}`, {
        last_message_at: new Date().toISOString()
      })

      setMessages(prev => [...prev, createdMessage])
    } catch (err) {
      showToast('❌', 'Poruka nije poslana.')
      setNewMessage(textToSend)
    }
  }

  const getConvoDetails = (convo) => {
    const isBuyer = String(convo.buyerId || convo.participant_one) === String(user.id)
    const otherId = isBuyer ? (convo.sellerId || convo.participant_two) : (convo.buyerId || convo.participant_one)
    
    const otherUser = users.find(u => String(u.id) === String(otherId)) || { firstName: 'Korisnik', lastName: '', username: 'nepoznato' }
    const product = products.find(p => String(p.id) === String(convo.productId)) || { title: 'Artikal', price: 0, emoji: '📦' }
    
    return { otherUser, product }
  }

  if (!user) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-2)' }}>
        <h2>Pristup odbijen</h2>
      </div>
    )
  }

  const activeConvo = conversations.find(c => String(c.id) === String(activeConvoId))
  const activeDetails = activeConvo ? getConvoDetails(activeConvo) : null

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 24px' }}>
      
      {/* GLAVNI CHAT KONTEJNER */}
      <div className="card chat-container-box" style={{ 
        display: 'grid', 
        gridTemplateColumns: '320px 1fr', 
        height: '650px', // Fiksna visina kutije chata da izgleda uredno i kompaktno
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden'
      }}>
        
        {/* SIDEBAR: Lista konverzacija sa lijeve strane */}
        <aside 
          className={`chat-sidebar ${activeConvoId ? 'mobile-hidden' : ''}`} 
          style={{ 
            borderRight: '1px solid var(--border-light)', 
            background: 'var(--bg-card)', 
            display: 'flex', 
            flexDirection: 'column',
            height: '100%'
          }}
        >
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border-light)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>Poruke</h2>
          </div>

          {loadingConvos ? (
            <Spinner text="Učitavanje..." />
          ) : conversations.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-3)', fontSize: '14px' }}>
              Nemate otvorenih konverzacija.
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {conversations.map(convo => {
                const { otherUser, product } = getConvoDetails(convo)
                const isActive = String(activeConvoId) === String(convo.id)
                const initials = `${otherUser.firstName?.[0] || ''}${otherUser.lastName?.[0] || ''}`.toUpperCase()

                return (
                  <div
                    key={convo.id}
                    onClick={() => navigate(`/chat/${convo.id}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 20px',
                      borderBottom: '1px solid var(--border-light)',
                      cursor: 'pointer',
                      background: isActive ? 'var(--brown-light)' : 'transparent',
                      transition: 'background 0.2s ease',
                    }}
                  >
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '99px',
                      background: 'var(--green-light)',
                      color: 'var(--green)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 600, fontSize: '13px', flexShrink: 0
                    }}>
                      {initials || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {otherUser.firstName} {otherUser.lastName}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                        {product.emoji} {product.title}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </aside>

        {/* DESNA STRANA: Aktivni prozor za poruke */}
        <main 
          className={`chat-main ${!activeConvoId ? 'mobile-hidden' : ''}`} 
          style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', height: '100%' }}
        >
          {activeConvoId && activeDetails ? (
            <>
              {/* Header aktivnog chata */}
              <div style={{
                padding: '14px 20px',
                background: 'var(--bg-card)',
                borderBottom: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button 
                    onClick={() => navigate('/chat')}
                    className="mobile-back-btn"
                    style={{ 
                      background: 'transparent', border: 'none', fontSize: '16px', 
                      cursor: 'pointer', color: 'var(--text-2)', padding: '4px 8px', marginLeft: '-8px'
                    }}
                  >
                    ←
                  </button>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: 'var(--text)' }}>
                      {activeDetails.otherUser.firstName} {activeDetails.otherUser.lastName}
                    </h3>
                    <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>@{activeDetails.otherUser.username}</span>
                  </div>
                </div>

                {/* Mini kartica artikla na vrhu desno */}
                <div 
                  onClick={() => navigate(`/product/${activeDetails.product.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    background: 'var(--bg)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    cursor: 'pointer',
                    maxWidth: '55%',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{activeDetails.product.emoji}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {activeDetails.product.title}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--orange)', marginTop: '1px' }}>
                      {activeDetails.product.price} KM
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista poruka sa unutrašnjim skrolanjem */}
              <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-input)' }}>
                {loadingMessages ? (
                  <Spinner text="Učitavanje poruka..." />
                ) : messages.length === 0 ? (
                  <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-3)', fontSize: '13px' }}>
                    Nema poruka. Pošaljite poruku i započnite razgovor!
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMe = String(msg.senderId) === String(user.id)
                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          justifyContent: isMe ? 'flex-end' : 'flex-start'
                        }}
                      >
                        <div
                          style={{
                            maxWidth: '70%',
                            padding: '10px 14px',
                            borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                            background: isMe ? 'var(--green)' : 'var(--bg-card)',
                            color: isMe ? '#ffffff' : 'var(--text)',
                            border: isMe ? 'none' : '1px solid var(--border-light)',
                            boxShadow: 'var(--shadow-sm)',
                            fontSize: '13.5px',
                            lineHeight: '1.5',
                            wordBreak: 'break-word'
                          }}
                        >
                          {msg.body}
                          <div style={{
                            textAlign: 'right',
                            fontSize: '10px',
                            marginTop: '4px',
                            color: isMe ? 'rgba(255,255,255,0.7)' : 'var(--text-3)'
                          }}>
                            {new Date(msg.created_at).toLocaleTimeString('bs-BA', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Forma za unosa na dnu desne strane */}
              <form 
                onSubmit={handleSendMessage}
                style={{
                  padding: '16px 20px',
                  background: 'var(--bg-card)',
                  borderTop: '1px solid var(--border-light)',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center'
                }}
              >
                <input
                  type="text"
                  className="form-input"
                  placeholder="Napišite poruku..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  style={{ flex: 1, margin: 0, background: 'var(--bg-input)' }}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0 20px', height: '42px' }}>
                  Pošalji
                </button>
              </form>
            </>
          ) : (
            <div style={{ display: 'flex', margin: 'auto', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', textAlign: 'center', padding: '20px' }}>
              <div>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>💬</div>
                <h3 style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text)', margin: '0 0 4px 0' }}>Vaš inbox</h3>
                <p style={{ fontSize: '13px', margin: 0 }}>Izaberite konverzaciju sa lijeve strane da započnete razgovor.</p>
              </div>
            </div>
          )}
        </main>

        {/* Responzivnost za mobilne uređaje */}
        <style>{`
          .mobile-back-btn { display: none; }
          @media (max-width: 768px) {
            .chat-container-box { grid-template-columns: 1fr !important; height: 550px !important; margin: 10px auto !important; }
            .mobile-hidden { display: none !important; }
            .mobile-back-btn { display: block !important; }
          }
        `}</style>
      </div>
    </div>
  )
}