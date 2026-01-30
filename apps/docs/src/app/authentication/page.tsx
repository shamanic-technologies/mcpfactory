import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication",
  description: "Set up your MCP Factory API keys and configure BYOK credentials for OpenAI, Apollo, Resend, and more.",
  openGraph: {
    title: "Authentication | MCP Factory Docs",
    description: "Configure API keys and BYOK credentials.",
  },
};

export default function AuthenticationPage() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-12">
      <h1 className="text-4xl font-bold mb-4">Authentication</h1>
      <p className="text-xl text-gray-600 mb-8">
        Set up your API keys and BYOK credentials to start using MCP Factory.
      </p>

      <div className="prose prose-lg">
        <h2>1. Create an Account</h2>
        <p>
          Sign up at{" "}
          <a href="https://app.mcpfactory.org/sign-up">app.mcpfactory.org</a> to
          get started. You can use email or OAuth (Google, GitHub).
        </p>

        <h2>2. Get Your API Key</h2>
        <p>
          After signing in, go to <strong>Settings → API Keys</strong> to
          generate your MCP Factory API key.
        </p>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>mcpf_live_xxxxxxxxxxxxxxxxxxxx</code>
        </pre>
        <p>
          <strong>Keep this key secret.</strong> It grants full access to your
          account.
        </p>

        <h2>3. Configure BYOK Keys</h2>
        <p>
          MCP Factory uses your own API keys for underlying services. Go to{" "}
          <strong>Settings → BYOK Keys</strong> to configure them.
        </p>

        <h3>Required Keys by MCP</h3>
        <table>
          <thead>
            <tr>
              <th>MCP</th>
              <th>Required Keys</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Sales Outreach</td>
              <td>OpenAI/Anthropic, Apollo, Resend</td>
            </tr>
            <tr>
              <td>Influencer Pitch</td>
              <td>OpenAI/Anthropic, Hunter.io, Resend</td>
            </tr>
            <tr>
              <td>Google Ads</td>
              <td>OpenAI/Anthropic, Google Ads API</td>
            </tr>
          </tbody>
        </table>

        <h3>Where to Get Keys</h3>
        <table>
          <thead>
            <tr>
              <th>Provider</th>
              <th>Purpose</th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>OpenAI</td>
              <td>Content generation</td>
              <td>
                <a href="https://platform.openai.com/api-keys">
                  platform.openai.com
                </a>
              </td>
            </tr>
            <tr>
              <td>Anthropic</td>
              <td>Content generation</td>
              <td>
                <a href="https://console.anthropic.com/">console.anthropic.com</a>
              </td>
            </tr>
            <tr>
              <td>Apollo</td>
              <td>Lead enrichment</td>
              <td>
                <a href="https://app.apollo.io/#/settings/integrations/api">
                  apollo.io
                </a>
              </td>
            </tr>
            <tr>
              <td>Resend</td>
              <td>Email sending</td>
              <td>
                <a href="https://resend.com/api-keys">resend.com</a>
              </td>
            </tr>
            <tr>
              <td>Hunter.io</td>
              <td>Email finding</td>
              <td>
                <a href="https://hunter.io/api-keys">hunter.io</a>
              </td>
            </tr>
          </tbody>
        </table>

        <h2>4. Environment Variables</h2>
        <p>When using MCPs locally, set these environment variables:</p>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{`# Required for all MCPs
MCPFACTORY_API_KEY=mcpf_live_xxxxxxxxxxxx

# Optional: Override dashboard BYOK keys
OPENAI_API_KEY=sk-xxxx
ANTHROPIC_API_KEY=sk-ant-xxxx
APOLLO_API_KEY=xxxx
RESEND_API_KEY=re_xxxx`}</code>
        </pre>
        <p>
          <strong>Note:</strong> Keys set in environment variables take
          precedence over dashboard-configured keys.
        </p>

        <h2>5. Verify Setup</h2>
        <p>Test your configuration by running:</p>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{`curl https://api.mcpfactory.org/me \\
  -H "Authorization: Bearer mcpf_live_xxxx"`}</code>
        </pre>
        <p>You should see your account details and configured BYOK keys.</p>
      </div>
    </div>
  );
}
