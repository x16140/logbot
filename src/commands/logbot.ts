import {
  CommandInteraction,
  MessageButton,
  MessageActionRow,
  MessageEmbed,
  ButtonInteraction,
} from 'discord.js';

import { Discord, Slash, SlashGroup, ButtonComponent } from 'discordx';

@Discord()
@SlashGroup({ name: 'logbot', description: 'Logbot setup and options' })
@SlashGroup('logbot')
export class LogCommand {
  @Slash('create-log-message', { description: 'Create the log creation menu' })
  async createLogMessage(interaction: CommandInteraction): Promise<void> {
    await interaction.reply({ content: 'Sending message...', ephemeral: true });

    await interaction.channel?.send({
      embeds: [
        new MessageEmbed()
          .setTitle('LogBot')
          .setDescription('Use the button below to create a new log.'),
      ],
      components: [
        new MessageActionRow().addComponents(
          new MessageButton()
            .setLabel('New Log')
            .setEmoji('➕')
            .setStyle('PRIMARY')
            .setCustomId('create-log')
        ),
      ],
    });

    await interaction.editReply({ content: 'Message sent!' });
  }

  @ButtonComponent('create-log')
  async createLogButton(interaction: ButtonInteraction) {
    await interaction.reply(`👋 ${interaction.member}`);
  }
}
