import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication",
  description: "Set up your MCP Factory API keys and configure BYOK credentials for Apollo, Anthropic, and more.",
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
          <a href="https://dashboard.mcpfactory.org/sign-up">
            dashboard.mcpfactory.org
          </a>{" "}
          to get started. You can use email or Google OAuth.
        </p>

        <h2>2. Get Your API Key</h2>
        <p>
          After signing in, go to{" "}
          <strong>Settings → API Key</strong> to generate your MCP Factory API
          key.
        </p>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>mcpf_xxxxxxxxxxxxxxxxxxxxxxxxxxxx</code>
        </pre>
        <p>
          <strong>Keep this key secret.</strong> It grants full access to your
          account and organization.
        </p>

        <h2>3. Using Your API Key</h2>

        <h3>For MCP (ChatGPT, Claude, Cursor)</h3>
        <p>Include as Bearer token in the Authorization header:</p>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>Authorization: Bearer YOUR_API_KEY</code>
        </pre>

        <h3>For REST API</h3>
        <p>Include in the X-API-Key header:</p>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{`curl https://api.mcpfactory.org/v1/me \\
  -H "X-API-Key: YOUR_API_KEY"`}</code>
        </pre>

        <h2>4. Configure BYOK Keys (Optional)</h2>
        <p>
          MCP Factory can use your own API keys for underlying services. Go to{" "}
          <strong>Settings → Keys</strong> to configure them.
        </p>

        <h3>Supported Providers</h3>
        <table>
          <thead>
            <tr>
              <th>Provider</th>
              <th>Purpose</th>
              <th>Where to Get</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Apollo</td>
              <td>Lead search and enrichment</td>
              <td>
                <a href="https://app.apollo.io/#/settings/integrations/api">
                  apollo.io
                </a>
              </td>
            </tr>
            <tr>
              <td>Anthropic</td>
              <td>AI content generation</td>
              <td>
                <a href="https://console.anthropic.com/">
                  console.anthropic.com
                </a>
              </td>
            </tr>
          </tbody>
        </table>

        <h3>Benefits of BYOK</h3>
        <ul>
          <li>Use your own API credits and pricing</li>
          <li>Higher rate limits</li>
          <li>Full control over your data</li>
        </ul>

        <h2>5. Verify Setup</h2>
        <p>Test your configuration:</p>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{`curl https://api.mcpfactory.org/v1/me \\
  -H "X-API-Key: YOUR_API_KEY"`}</code>
        </pre>
        <p>You should see your account details and organization info.</p>

        <h2>Security Best Practices</h2>
        <ul>
          <li>Never commit API keys to version control</li>
          <li>Use environment variables for local development</li>
          <li>Rotate keys periodically</li>
          <li>Use organization-level keys for team access</li>
        </ul>
      </div>
    </div>
  );
}
