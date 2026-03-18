const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { setPrefix, getPrefix } = require('../../utils/serverConfig');

module.exports = {
    aliases: ['sp'],
    data: new SlashCommandBuilder()
        .setName('setprefix')
        .setDescription('Thay đổi prefix lệnh của bot trên server này (chỉ Admin)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(opt =>
            opt.setName('prefix')
               .setDescription('Prefix mới (1-3 ký tự, ví dụ: !, ?, ~, ;;)')
               .setRequired(true)
               .setMinLength(1)
               .setMaxLength(3)
        ),

    async execute(interaction) {
        // Kiểm tra quyền (phòng khi dùng prefix command)
        if (!interaction.guild) {
            return interaction.reply({ content: '❌ Lệnh này chỉ dùng được trong server!', flags: 64 });
        }

        const member = interaction.guild.members?.cache?.get(interaction.user.id)
                    ?? await interaction.guild.members?.fetch(interaction.user.id).catch(() => null);

        if (member && !member.permissions?.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({ content: '❌ Bạn cần quyền **Quản lý Server** để dùng lệnh này!', flags: 64 });
        }

        const newPrefix = interaction.options.getString('prefix');
        const guildId = interaction.guild.id;

        // Lấy prefix cũ để hiển thị
        const oldPrefix = await getPrefix(guildId);

        // Lưu prefix mới
        await setPrefix(guildId, newPrefix);

        const embed = new EmbedBuilder()
            .setTitle('⚙️ Đã cập nhật Prefix')
            .setColor('#2ecc71')
            .addFields(
                { name: 'Prefix cũ', value: `\`${oldPrefix}\``, inline: true },
                { name: 'Prefix mới', value: `\`${newPrefix}\``, inline: true },
            )
            .setDescription(`Từ bây giờ hãy dùng \`${newPrefix}lệnh\` thay vì \`${oldPrefix}lệnh\`.\n\nVí dụ: \`${newPrefix}profile\`, \`${newPrefix}explore\``)
            .setFooter({ text: `Thay đổi bởi ${interaction.user.username}` })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
