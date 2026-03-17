const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType } = require('discord.js');

module.exports = {
    category: 'System',
    aliases: ['h'],
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Xem danh sách lệnh hoặc hướng dẫn chi tiết từng lệnh')
        .addStringOption(option => 
            option.setName('command')
                .setDescription('Tên lệnh muốn xem hướng dẫn chi tiết')
                .setRequired(false)
        ),
    async execute(interaction) {
        const commandName = interaction.options.getString('command');
        const commands = interaction.client.commands;

        if (commandName) {
            const command = commands.get(commandName.toLowerCase()) || 
                          commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName.toLowerCase()));

            if (!command) {
                return interaction.reply({ content: `❌ Không tìm thấy lệnh \`${commandName}\`.`, flags: require('discord.js').MessageFlags.Ephemeral });
            }

            const embed = new EmbedBuilder()
                .setTitle(`📖 Hướng dẫn lệnh: /${command.data.name}`)
                .setColor('#2ecc71')
                .setDescription(command.help?.description || command.data.description)
                .addFields(
                    { name: '📑 Sử dụng (Usage)', value: `\`${command.help?.usage || `/${command.data.name}`}\``, inline: true },
                    { name: '🔗 Viết tắt (Aliases)', value: command.aliases?.map(a => `\`$${a}\``).join(', ') || 'Không có', inline: true }
                );

            if (command.help?.examples && command.help.examples.length > 0) {
                embed.addFields({ name: '💡 Ví dụ (Examples)', value: command.help.examples.map(ex => `\`${ex}\``).join('\n') });
            }

            return interaction.reply({ embeds: [embed] });
        }

        // --- Categorized View Logic ---
        const categories = {
            'RPG': { emoji: '⚔️', label: 'RPG & Thám Hiểm' },
            'Crafting': { emoji: '🛠️', label: 'Khai Thác & Chế Tạo' },
            'Economy': { emoji: '💰', label: 'Kinh Tế & Chợ' },
            'Gambling': { emoji: '🎰', label: 'Trò Chơi Cá Cược' },
            'System': { emoji: '⚙️', label: 'Hệ Thống & Thông Tin' }
        };

        const createHelpEmbed = (categoryKey = null) => {
            const embed = new EmbedBuilder()
                .setTitle('📜 Bảng Chỉ Dẫn EchoWorld RPG')
                .setColor('#3498db')
                .setThumbnail(interaction.client.user.displayAvatarURL())
                .setFooter({ text: 'Dùng menu bên dưới để chọn Category | Gõ /help [tên_lệnh] để xem chi tiết' });

            if (!categoryKey) {
                embed.setDescription('Chào mừng dũng sĩ đến với EchoWorld! Hãy chọn một danh mục bên dưới để khám phá các lệnh hỗ trợ cho hành trình của bạn.');
                for (const [key, cat] of Object.entries(categories)) {
                    const count = commands.filter(cmd => cmd.category === key).size;
                    embed.addFields({ name: `${cat.emoji} ${cat.label}`, value: `> Có **${count}** lệnh trong mục này.`, inline: true });
                }
            } else {
                const catInfo = categories[categoryKey];
                embed.setTitle(`${catInfo.emoji} Danh mục: ${catInfo.label}`);
                const categoryCmds = commands.filter(cmd => cmd.category === categoryKey);
                
                const list = categoryCmds.map(cmd => `**\`/${cmd.data.name}\`**: ${cmd.data.description}`).join('\n');
                embed.setDescription(list || '*Không có lệnh nào trong mục này.*');
            }
            return embed;
        };

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help_category')
            .setPlaceholder('Chọn danh mục lệnh...')
            .addOptions([
                { label: 'Trang Chủ', value: 'home', emoji: '🏠', description: 'Quay lại menu chính' },
                ...Object.entries(categories).map(([key, cat]) => ({
                    label: cat.label,
                    value: key,
                    emoji: cat.emoji,
                    description: `Xem các lệnh ${cat.label}`
                }))
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const response = await interaction.reply({ embeds: [createHelpEmbed()], components: [row] });

        const collector = response.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60000 });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) return i.reply({ content: 'Lệnh này không dành cho bạn!', ephemeral: true });
            
            const selected = i.values[0];
            const categoryKey = selected === 'home' ? null : selected;
            
            await i.update({ embeds: [createHelpEmbed(categoryKey)] });
        });

        collector.on('end', () => {
            interaction.editReply({ components: [] }).catch(() => {});
        });
    }
};
