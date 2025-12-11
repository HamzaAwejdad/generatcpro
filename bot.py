from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ApplicationBuilder, CommandHandler, CallbackQueryHandler, ContextTypes

# Load links
with open("links.txt", "r", encoding="utf-8") as f:
    links = [line.strip() for line in f.readlines()]

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton("Generate Canva Pro Link", callback_data="generate")]
    ]
    await update.message.reply_text(
        "Welcome to Canva Pro Generator Bot!", 
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

async def handle_buttons(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    if query.data == "generate":
        if links:
            link = links.pop(0)

            # Save updated remaining links
            with open("links.txt", "w", encoding="utf-8") as f:
                f.write("\n".join(links))

            await query.edit_message_text(f"Your Canva Pro Link:\n{link}")
        else:
            await query.edit_message_text("No more links available.")

def main():
    app = ApplicationBuilder().token("8380162033:AAFLhEHJJKLLSxJn5G-q41WcmeT4xpkzWuE").build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CallbackQueryHandler(handle_buttons))

    print("Bot is running...")
    app.run_polling()  # <-- NO asyncio.run()

if __name__ == "__main__":
    main()
