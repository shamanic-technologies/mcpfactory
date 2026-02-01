import Image from "next/image";

const DASHBOARD_URL = "https://dashboard.mcpfactory.org";

const FEATURES = [
  {
    icon: "🎯",
    title: "Find Qualified Leads",
    description: "Search 275M+ contacts via Apollo. Target by role, company size, industry, and more.",
  },
  {
    icon: "✨",
    title: "AI-Personalized Emails",
    description: "Each email is unique. AI researches the recipient and crafts a personalized message.",
  },
  {
    icon: "📊",
    title: "Automatic A/B Testing",
    description: "Test subject lines, CTAs, and messaging. AI optimizes based on real results.",
  },
  {
    icon: "📬",
    title: "Smart Sending",
    description: "Optimal send times, throttling, and warmup. Maximize deliverability automatically.",
  },
  {
    icon: "💬",
    title: "Reply Detection",
    description: "AI qualifies replies as interested, not interested, or out of office. Focus on hot leads.",
  },
  {
    icon: "📈",
    title: "Real-time Analytics",
    description: "Track opens, clicks, replies, and meetings. See what's working in real-time.",
  },
];

const STEPS = [
  {
    number: 1,
    title: "Connect Your AI",
    description: "Add MCP Factory to ChatGPT, Claude, or Cursor",
    code: "https://mcp.mcpfactory.org/mcp",
  },
  {
    number: 2,
    title: "Describe Your Campaign",
    description: "Tell the AI who to target and what to say",
    example: '"Send cold emails to CTOs at B2B SaaS companies about our dev tool"',
  },
  {
    number: 3,
    title: "AI Does The Work",
    description: "Finds leads, writes emails, sends, and optimizes",
  },
  {
    number: 4,
    title: "You Get Meetings",
    description: "Reply to interested prospects and close deals",
  },
];

const FAQ = [
  {
    question: "What makes AI cold email different from templates?",
    answer: "Templates are generic. AI reads each prospect's LinkedIn, company website, and recent news to write truly personalized emails. This typically gets 2-3x higher response rates.",
  },
  {
    question: "How many emails can I send?",
    answer: "Free: 1,000 emails. Pro ($20/mo): 10,000 emails. You also pay for leads (Apollo) and AI (Anthropic) at their standard rates - typically ~$0.02/email total.",
  },
  {
    question: "Will my emails land in spam?",
    answer: "We use best practices: proper warmup, optimal send times, throttling, and your own domain. Most users see 95%+ inbox placement.",
  },
  {
    question: "Can I review emails before sending?",
    answer: "Yes! You can run in preview mode to see all generated emails before any are sent. Or let AI send automatically and monitor results.",
  },
  {
    question: "What AI assistants work with this?",
    answer: "ChatGPT (Plus, Pro, Team), Claude (Web, Desktop, Code), and Cursor IDE. Any MCP-compatible client works.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="https://mcpfactory.org/logo-head.jpg"
              alt="MCP Factory"
              width={36}
              height={36}
              className="rounded-lg"
            />
            <span className="font-bold text-xl text-primary-600">Cold Email AI</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://docs.mcpfactory.org/sales-outreach"
              className="text-gray-600 hover:text-primary-600 text-sm transition hidden sm:block"
            >
              Docs
            </a>
            <a
              href={`${DASHBOARD_URL}/sign-in`}
              className="text-gray-600 hover:text-primary-600 text-sm font-medium transition"
            >
              Sign In
            </a>
            <a
              href={`${DASHBOARD_URL}/sign-up`}
              className="bg-primary-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-primary-600 shadow-md"
            >
              Start Free
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="gradient-bg py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block bg-primary-100 text-primary-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-primary-200">
            1,000 Free Emails
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="gradient-text">AI Cold Email</span>
            <br />
            <span className="text-gray-800">That Actually Works</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Launch personalized cold email campaigns from ChatGPT, Claude, or Cursor.
            AI finds leads, writes emails, sends, and optimizes automatically.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <a
              href={`${DASHBOARD_URL}/sign-up`}
              className="px-8 py-4 bg-primary-500 text-white rounded-full hover:bg-primary-600 font-medium text-lg shadow-lg"
            >
              Start Sending Free
            </a>
            <a
              href="https://docs.mcpfactory.org/sales-outreach"
              className="px-8 py-4 bg-white border border-gray-200 text-gray-700 rounded-full hover:border-primary-300 font-medium"
            >
              See How It Works
            </a>
          </div>

          <p className="text-sm text-gray-500">
            No credit card required • Works with ChatGPT, Claude, Cursor
          </p>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 px-4 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-gray-500 uppercase tracking-wider mb-6">Trusted by sales teams at</p>
          <div className="flex flex-wrap justify-center gap-8 text-gray-400">
            <span className="text-lg font-semibold">Startups</span>
            <span className="text-lg font-semibold">Agencies</span>
            <span className="text-lg font-semibold">Consultants</span>
            <span className="text-lg font-semibold">Freelancers</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">
              Everything You Need for Cold Email
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From lead finding to meeting booking. All automated by AI.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-bold text-lg mb-2 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">
              Send Your First Campaign in 5 Minutes
            </h2>
            <p className="text-xl text-gray-600">
              No complex setup. Just connect and go.
            </p>
          </div>
          
          <div className="space-y-12">
            {STEPS.map((step) => (
              <div key={step.number} className="flex gap-6">
                <div className="w-12 h-12 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold text-lg shrink-0 shadow-md">
                  {step.number}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-xl mb-2 text-gray-800">{step.title}</h3>
                  <p className="text-gray-600 mb-2">{step.description}</p>
                  {step.code && (
                    <code className="text-sm bg-gray-100 text-primary-700 px-3 py-1.5 rounded-lg block overflow-x-auto">
                      {step.code}
                    </code>
                  )}
                  {step.example && (
                    <p className="text-gray-500 italic bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                      {step.example}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Start free. Scale when you're ready.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
              <h3 className="font-bold text-2xl mb-2 text-gray-800">Free</h3>
              <p className="text-gray-600 mb-4">Perfect to get started</p>
              <div className="text-4xl font-bold mb-6 text-gray-800">$0<span className="text-lg font-normal text-gray-500">/month</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span> 1,000 emails
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span> AI personalization
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span> Lead search
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span> Reply tracking
                </li>
              </ul>
              <a
                href={`${DASHBOARD_URL}/sign-up`}
                className="block text-center py-3 px-6 bg-gray-100 text-gray-800 rounded-full font-medium hover:bg-gray-200"
              >
                Start Free
              </a>
            </div>
            
            <div className="bg-primary-500 rounded-2xl p-8 text-white shadow-lg relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent-500 text-white text-sm px-4 py-1 rounded-full font-medium">
                Most Popular
              </div>
              <h3 className="font-bold text-2xl mb-2">Pro</h3>
              <p className="text-primary-100 mb-4">For serious outreach</p>
              <div className="text-4xl font-bold mb-6">$20<span className="text-lg font-normal text-primary-200">/month</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <span>✓</span> 10,000 emails
                </li>
                <li className="flex items-center gap-2">
                  <span>✓</span> Everything in Free
                </li>
                <li className="flex items-center gap-2">
                  <span>✓</span> A/B testing
                </li>
                <li className="flex items-center gap-2">
                  <span>✓</span> Priority support
                </li>
              </ul>
              <a
                href={`${DASHBOARD_URL}/sign-up`}
                className="block text-center py-3 px-6 bg-white text-primary-600 rounded-full font-medium hover:bg-primary-50"
              >
                Get Pro
              </a>
            </div>
          </div>
          
          <p className="text-center text-gray-500 mt-8 text-sm">
            + BYOK costs: Apollo leads (~$0.01/lead) + Anthropic AI (~$0.01/email)
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">
              Frequently Asked Questions
            </h2>
          </div>
          
          <div className="space-y-6">
            {FAQ.map((item) => (
              <div key={item.question} className="border border-gray-200 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-2 text-gray-800">{item.question}</h3>
                <p className="text-gray-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 gradient-bg">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">
            Ready to Send Better Cold Emails?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Start with 1,000 free emails. No credit card required.
          </p>
          <a
            href={`${DASHBOARD_URL}/sign-up`}
            className="inline-block px-8 py-4 bg-primary-500 text-white rounded-full hover:bg-primary-600 font-medium text-lg shadow-lg"
          >
            Start Sending Free
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Image
              src="https://mcpfactory.org/logo-head.jpg"
              alt="MCP Factory"
              width={32}
              height={32}
              className="rounded-md"
            />
            <span className="font-bold text-white text-lg">MCP Factory</span>
          </div>
          <p className="text-sm mb-4">AI-powered cold email automation</p>
          <div className="flex justify-center gap-6 text-sm">
            <a href="https://mcpfactory.org" className="hover:text-primary-400 transition">
              Main Site
            </a>
            <a href="https://docs.mcpfactory.org" className="hover:text-primary-400 transition">
              Docs
            </a>
            <a
              href="https://github.com/shamanic-technologies/mcpfactory"
              className="hover:text-primary-400 transition"
            >
              GitHub
            </a>
          </div>
          <p className="text-xs mt-6">© 2025 MCP Factory. MIT License.</p>
        </div>
      </footer>
    </main>
  );
}
