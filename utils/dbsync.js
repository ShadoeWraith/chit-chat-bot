import { Guild } from '../models/Guild.js';

export function dbSync(guildId) {
    Guild.findByPk(guildId).then(() => {
        Guild.findOrCreate({ where: { guildId: guildId } });
    });
}
