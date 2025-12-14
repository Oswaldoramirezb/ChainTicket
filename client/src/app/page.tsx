'use client'

import { useState } from 'react'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'business' | 'customer'>('business')

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <nav className="border-b border-purple-500/20 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                TicketChain
              </span>
              <span className="ml-2 text-xs bg-movement px-2 py-1 rounded-full text-white">
                Movement
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 text-sm text-purple-300 hover:text-white transition-colors">
                Docs
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all">
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Tokenized Tickets for Your{' '}
            <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              Business
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Create, sell, and manage tokenized tickets on Movement blockchain. 
            Perfect for bars, events, restaurants, and more.
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="bg-black/30 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('business')}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'business'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              For Businesses
            </button>
            <button
              onClick={() => setActiveTab('customer')}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'customer'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              For Customers
            </button>
          </div>
        </div>

        {activeTab === 'business' ? (
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon="🎫"
              title="Create Tickets"
              description="Generate tokenized tickets for your events, capacity limits, or special offers."
            />
            <FeatureCard
              icon="🤖"
              title="AI Recommendations"
              description="Get smart suggestions on how many tickets to create based on your business data."
            />
            <FeatureCard
              icon="📊"
              title="Analytics Dashboard"
              description="Track sales, validate entries with QR codes, and monitor revenue in real-time."
            />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon="💳"
              title="Easy Payment"
              description="Pay with crypto using x402. Fast, secure, and transparent transactions."
            />
            <FeatureCard
              icon="📱"
              title="Mobile QR Tickets"
              description="Access your tickets instantly on your phone. Show the QR code to enter."
            />
            <FeatureCard
              icon="🔐"
              title="Secure Ownership"
              description="Your tickets are NFTs on Movement blockchain. True ownership, no fakes."
            />
          </div>
        )}

        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">Get Started</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-lg font-medium hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/25">
              Create Your First Event
            </button>
            <button className="px-8 py-4 border border-purple-500 text-purple-300 rounded-xl text-lg font-medium hover:bg-purple-500/10 transition-all">
              Browse Events
            </button>
          </div>
        </div>

        <div className="mt-20 p-8 bg-black/30 rounded-2xl border border-purple-500/20">
          <h3 className="text-xl font-semibold text-white mb-4">Powered By</h3>
          <div className="flex flex-wrap gap-8 items-center justify-center text-gray-400">
            <span className="flex items-center gap-2">
              <span className="text-2xl">🔷</span> Movement Blockchain
            </span>
            <span className="flex items-center gap-2">
              <span className="text-2xl">🔐</span> Privy Auth
            </span>
            <span className="flex items-center gap-2">
              <span className="text-2xl">💰</span> x402 Payments
            </span>
            <span className="flex items-center gap-2">
              <span className="text-2xl">🤖</span> AI Assistant
            </span>
          </div>
        </div>
      </div>

      <footer className="border-t border-purple-500/20 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500">
          <p>Built for Movement M1 Hackathon 2024</p>
        </div>
      </footer>
    </main>
  )
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="p-6 bg-black/30 rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-all hover:transform hover:scale-105">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  )
}
