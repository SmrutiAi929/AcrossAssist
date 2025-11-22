# How to Get a FREE Gemini API Key for Testing

## ✅ Yes, Google Gemini API has a FREE tier!

**Free Tier Benefits:**
- **60 requests per minute** - Perfect for testing and development
- No credit card required
- No expiration (as long as you stay within limits)

## Step-by-Step Instructions:

### 1. **Go to Google AI Studio**
   Open your browser and visit: **https://aistudio.google.com/apikey**

### 2. **Sign In**
   - Sign in with your Google account (Gmail account works)

### 3. **Create API Key**
   - Click the **"Create API Key"** button
   - If prompted, select or create a Google Cloud project (don't worry, it's free)
   - Your API key will be generated and displayed

### 4. **Copy Your API Key**
   - Copy the generated API key immediately
   - It will look something like: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX`
   - ⚠️ **Important**: Save it securely - you may not see it again!

### 5. **Add to Your Project**
   Add the API key to your `.env` file in the project root:

   ```
   REACT_APP_GEMINI_API_KEY=your-api-key-here
   ```

### 6. **Restart the Server**
   After adding the API key, restart your development server:
   - Stop the current server (Ctrl+C)
   - Run `npm start` again

## ⚠️ Security Notes:
- Never commit your `.env` file to Git (it's already in `.gitignore`)
- Never share your API key publicly
- If you accidentally share it, regenerate a new key immediately

## 🔗 Quick Links:
- **Get API Key**: https://aistudio.google.com/apikey
- **API Documentation**: https://ai.google.dev/gemini-api/docs
- **Pricing Info**: https://ai.google.dev/pricing

## 💡 Tips:
- The free tier is perfect for development and testing
- You can check your usage in Google AI Studio dashboard
- If you exceed the free tier, you'll need to enable billing (but free tier is quite generous!)

