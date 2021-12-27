/**
 * Collection of items. It's similar to array, except the push method does
 * not add duplications, along with the addition of ``remove()`` method
 */
export class Collection<T> extends Array<T> {

    /**
     * Add items to the collection (if not exists yet)
     * @param items Items
     * @returns New length of the collection
     */
    push(...items: T[]): number {
        items = items.filter(v => !super.includes(v));
        return super.push(...items);
    }

    /**
     * Remove items from the collection (if already exists)
     * @param items Items
     * @returns New length of the collection
     */
    remove(...items: T[]): number {
        items.forEach(i => {
            const idx = super.indexOf(i);
            if (idx == -1) return;
            super.splice(idx, 1);
        });
        return super.length;
    }

}