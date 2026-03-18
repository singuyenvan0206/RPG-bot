const { SlashCommandBuilder, EmbedBuilder, codeBlock } = require('discord.js');
const { exec } = require('child_process');

module.exports = {
    category: 'System',
    aliases: ['up'],
    data: new SlashCommandBuilder()
        .setName('update')
        .setDescription('[Owner Only] Kéo code mới từ Git và restart bot'),

    async execute(interaction) {
        // Chỉ bot owner mới được dùng
        if (interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({
                content: '❌ Lệnh này chỉ dành riêng cho **Bot Owner**!',
                flags: 64,
            });
        }

        await interaction.deferReply();

        const startTime = Date.now();

        // Bước 1: git pull
        const gitResult = await runCommand('git pull');

        const gitEmbed = new EmbedBuilder()
            .setTitle('🔄 Đang cập nhật bot...')
            .setColor('#f39c12')
            .addFields({
                name: '📥 Git Pull',
                value: codeBlock(gitResult.output.slice(0, 1000) || '(no output)'),
            })
            .setTimestamp();

        if (gitResult.error) {
            gitEmbed
                .setColor('#e74c3c')
                .setTitle('❌ Git Pull thất bại!')
                .setDescription('Quá trình cập nhật bị lỗi. Bot **không** được restart.');
            return interaction.editReply({ embeds: [gitEmbed] });
        }

        await interaction.editReply({ embeds: [gitEmbed] });

        // Bước 2: pm2 restart
        const pm2Result = await runCommand('pm2 restart index --update-env');

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        const finalEmbed = new EmbedBuilder()
            .setColor(pm2Result.error ? '#e74c3c' : '#2ecc71')
            .setTitle(pm2Result.error ? '❌ PM2 Restart thất bại!' : '✅ Bot đã được cập nhật!')
            .addFields(
                {
                    name: '📥 Git Pull',
                    value: codeBlock(gitResult.output.slice(0, 500) || '(no output)'),
                },
                {
                    name: `${pm2Result.error ? '❌' : '🚀'} PM2 Restart`,
                    value: codeBlock(pm2Result.output.slice(0, 500) || '(no output)'),
                },
                {
                    name: '⏱️ Thời gian',
                    value: `\`${elapsed}s\``,
                    inline: true,
                },
                {
                    name: '👤 Thực hiện bởi',
                    value: `${interaction.user}`,
                    inline: true,
                },
            )
            .setFooter({ text: pm2Result.error ? 'Kiểm tra log server để debug.' : 'Bot sẽ online trở lại trong vài giây.' })
            .setTimestamp();

        return interaction.editReply({ embeds: [finalEmbed] });
    },
};

// ─── Helper: chạy shell command, trả về { output, error } ──────────────────
function runCommand(cmd) {
    return new Promise((resolve) => {
        exec(cmd, { cwd: process.cwd() }, (error, stdout, stderr) => {
            const output = [stdout, stderr].filter(Boolean).join('\n').trim();
            resolve({ output, error: !!error });
        });
    });
}
