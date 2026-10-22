/** Nama depan untuk sapaan ("Halo, Raka"). */
export const firstName = (name?: string) => (name ? (name.split(' ')[0] ?? name) : '');
