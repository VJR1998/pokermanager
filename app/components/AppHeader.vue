<template>
    <div class="card">
        <Menubar :model="items">
            <template #item="{ item, props, hasSubmenu, root }">
                <NuxtLink class="flex items-center" :to="item.to" v-bind="props.action">
                    <span>{{ item.label }}</span>
                    <Badge v-if="item.badge" :class="{ 'ml-auto': !root, 'ml-2': root }" :value="item.badge" />
                    <span v-if="item.shortcut"
                        class="ml-auto border border-surface rounded bg-emphasis text-muted-color text-xs p-1">{{
                        item.shortcut }}</span>
                    <i v-if="hasSubmenu" :class="[
                        'pi pi-angle-down ml-auto',
                        { 'pi-angle-down': root, 'pi-angle-right': !root },
                    ]"></i>
                </NuxtLink>
            </template>
            <template #end>
                <div class="flex items-center">
                    <Avatar image="https://primefaces.org/cdn/primevue/images/avatar/amyelsner.png" shape="circle" />
                </div>
            </template>
        </Menubar>
    </div>
</template>

<script>

export default {
    data() {
        return {
            items: [
                {
                    label: 'Dashboard',
                    icon: 'pi pi-home',
                    to: '/',
                },
                {
                    label: 'Settings',
                    icon: 'pi pi-search',
                    badge: 3,
                    items: [
                        {
                            label: 'Configure Tournament',
                            icon: 'pi pi-bolt',
                            shortcut: '⌘+S',
                            to: '/tournament-setup'
                        },
                        {
                            label: 'Customise',
                            icon: 'pi pi-server',
                            shortcut: '⌘+B'
                        },
                        {
                            separator: true
                        },
                        {
                            label: 'League',
                            icon: 'pi pi-pencil',
                            shortcut: '⌘+U'
                        }
                    ]
                }
            ]
        }
    }
};
</script>
