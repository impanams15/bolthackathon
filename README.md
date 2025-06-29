# UsheGuard - AI-Powered Charity Advisor

UsheGuard is a revolutionary platform that combines artificial intelligence with blockchain technology to help users make informed, impactful charitable donations. Built on the Algorand blockchain, it provides transparency, security, and verifiable impact tracking for all charitable giving.

## 🌟 Features

### 🤖 AI-Powered Charity Guidance
- Intelligent charity recommendations based on effectiveness and transparency
- Real-time analysis of charity impact metrics
- Personalized giving advice tailored to your interests and values
- Voice-enabled chat interface with text-to-speech responses

### 🔗 Blockchain-Powered Donations
- Secure, transparent donations on Algorand blockchain
- 4.5-second transaction finality
- Carbon-negative network impact
- Complete transaction traceability

### 🏆 Verified Impact Certificates
- Blockchain-verified donation certificates
- Immutable proof of charitable giving
- Tax-deductible donation tracking
- Shareable impact achievements

### 💼 Comprehensive Wallet Management
- Create or import Algorand wallets
- Real-time balance and asset tracking
- Secure mnemonic phrase storage
- Multi-asset support (ALGO and ASA tokens)

### 🎯 Advanced Features
- Custom ASA token minting
- Fundraising campaign creation
- Reddit integration for community engagement
- Voice recognition and audio responses
- Responsive design for all devices

## 🚀 Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Edge Functions)
- **Blockchain**: Algorand SDK
- **AI/Voice**: ElevenLabs TTS, Web Speech API
- **Video**: Tavus AI Avatar (optional)
- **Authentication**: Supabase Auth

## 📋 Prerequisites

Before setting up the project, you'll need:

1. **Supabase Account**: [Create account](https://supabase.com)
2. **ElevenLabs Account**: [Sign up](https://elevenlabs.io) for text-to-speech
3. **Tavus Account** (Optional): [Register](https://tavus.io) for AI video avatars
4. **Node.js**: Version 18 or higher

## 🛠️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd usheguard-charity-advisor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory with the following variables:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Algorand Configuration
   VITE_ALGORAND_NETWORK=testnet

   # ElevenLabs Configuration (for Text-to-Speech)
   ELEVENLABS_API_KEY=your_elevenlabs_api_key

   # Tavus Configuration (for Video Avatar - Optional)
   TAVUS_API_KEY=your_tavus_api_key
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the database migrations from `supabase/migrations/`
   - Deploy the edge functions from `supabase/functions/`

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 🗄️ Database Schema

The application uses the following main tables:

- **profiles**: User profile information
- **algorand_wallets**: Encrypted wallet storage
- **chat_conversations**: AI chat history
- **donations**: Donation transaction records
- **campaigns**: Fundraising campaigns
- **reddit_posts**: Cached Reddit content

## 🔧 Edge Functions

The platform includes several Supabase Edge Functions:

- `ai-chat`: Handles AI conversation logic
- `text-to-speech`: Generates audio responses
- `generate-avatar-video`: Creates AI video avatars
- `algo-transfer`: Processes ALGO transactions
- `mint-asa`: Creates custom tokens
- `process-donation`: Handles charitable donations
- `get-donations`: Retrieves donation history
- `get-campaigns`: Fetches fundraising campaigns
- `create-campaign`: Creates new campaigns
- `reddit-posts`: Fetches Reddit content

## 🌐 Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to your preferred platform**
   - Netlify (recommended)
   - Vercel
   - AWS S3 + CloudFront
   - Any static hosting service

3. **Configure environment variables** on your hosting platform

## 🔐 Security Features

- Row Level Security (RLS) on all database tables
- Encrypted wallet storage
- Secure API key management
- CORS protection on all endpoints
- Input validation and sanitization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please:
1. Check the [documentation](docs/)
2. Search existing [issues](issues/)
3. Create a new issue if needed

## 🙏 Acknowledgments

- Algorand Foundation for blockchain infrastructure
- Supabase for backend services
- ElevenLabs for AI voice technology
- Tavus for AI video avatars
- The open-source community

---

**Built with ❤️ for a better world through technology and charitable giving.**