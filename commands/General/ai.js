const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { askGrok, generateImage } = require('../../services/grok');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ai')
    .setDescription('Talk to Grok AI')
    .addSubcommand((sub) =>
      sub
        .setName('ask')
        .setDescription('Ask Grok AI a question')
        .addStringOption((opt) =>
          opt.setName('question').setDescription('What do you want to ask?').setRequired(true).setMaxLength(1000)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('image')
        .setDescription('Generate an image with Grok AI')
        .addStringOption((opt) =>
          opt.setName('prompt').setDescription('Describe the image to generate').setRequired(true).setMaxLength(500)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'ask') {
      const question = interaction.options.getString('question');
      await interaction.deferReply();

      try {
        const answer = await askGrok(question, {
          systemPrompt:
            'You are Grok, a helpful AI assistant built into a Discord bot. ' +
            'Give concise, clear, and friendly answers. ' +
            'Keep replies under 1800 characters so they fit in Discord embeds. ' +
            'If asked to do server moderation tasks, explain you handle that automatically.',
          maxTokens: 600,
        });

        const embed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setAuthor({ name: interaction.user.displayName, iconURL: interaction.user.displayAvatarURL() })
          .addFields({ name: '💬 Question', value: question.slice(0, 1024) })
          .setDescription(answer.slice(0, 2000))
          .setFooter({ text: 'Powered by Grok AI (xAI)' })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      } catch (err) {
        console.error('AI ask error:', err.message);
        await interaction.editReply({
          content: '❌ Grok AI is unavailable right now. Make sure your XAI_API_KEY is set correctly.',
        });
      }
    }

    if (sub === 'image') {
      const prompt = interaction.options.getString('prompt');
      await interaction.deferReply();

      try {
        const result = await generateImage(prompt);

        if (!result) throw new Error('No image returned');

        const embed = new EmbedBuilder()
          .setColor(0xeb459e)
          .setTitle('🎨 Generated Image')
          .setDescription(`**Prompt:** ${prompt}`)
          .setFooter({ text: 'Powered by Grok AI (xAI)' })
          .setTimestamp();

        if (result.startsWith('http')) {
          embed.setImage(result);
          await interaction.editReply({ embeds: [embed] });
        } else {
          const buffer = Buffer.from(result, 'base64');
          const attachment = new AttachmentBuilder(buffer, { name: 'generated.png' });
          embed.setImage('attachment://generated.png');
          await interaction.editReply({ embeds: [embed], files: [attachment] });
        }
      } catch (err) {
        console.error('AI image error:', err.message);
        await interaction.editReply({
          content: '❌ Image generation failed. The model may not be available yet — try `/ai ask` instead.',
        });
      }
    }
  },
};
