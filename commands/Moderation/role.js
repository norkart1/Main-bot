const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Add or remove a role from a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand((s) => s.setName('add').setDescription('Add a role to a member')
      .addUserOption((o) => o.setName('user').setDescription('Target user').setRequired(true))
      .addRoleOption((o) => o.setName('role').setDescription('Role to add').setRequired(true)))
    .addSubcommand((s) => s.setName('remove').setDescription('Remove a role from a member')
      .addUserOption((o) => o.setName('user').setDescription('Target user').setRequired(true))
      .addRoleOption((o) => o.setName('role').setDescription('Role to remove').setRequired(true))),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getMember('user');
    const role = interaction.options.getRole('role');

    if (!target) return interaction.editReply({ content: '❌ User not in this server.' });
    if (role.managed) return interaction.editReply({ content: '❌ This role is managed by an integration.' });
    if (role.position >= interaction.guild.members.me.roles.highest.position)
      return interaction.editReply({ content: '❌ I cannot manage this role (it\'s higher than my highest role).' });

    try {
      if (sub === 'add') {
        if (target.roles.cache.has(role.id)) return interaction.editReply({ content: `❌ **${target.user.tag}** already has this role.` });
        await target.roles.add(role, `Added by ${interaction.user.tag}`);
        await interaction.editReply({ content: `✅ Added **${role.name}** to **${target.user.tag}**.` });
      } else {
        if (!target.roles.cache.has(role.id)) return interaction.editReply({ content: `❌ **${target.user.tag}** doesn't have this role.` });
        await target.roles.remove(role, `Removed by ${interaction.user.tag}`);
        await interaction.editReply({ content: `✅ Removed **${role.name}** from **${target.user.tag}**.` });
      }
    } catch (err) {
      await interaction.editReply({ content: `❌ Failed: ${err.message}` });
    }
  },
};
