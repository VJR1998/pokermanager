<template>
    <div class="card" v-if="user">
        <Menubar :model="items">
            <template #item="{ item, props, hasSubmenu, root }">
                <NuxtLink class="flex items-center" :to="item.to" v-bind="props.action">
                    <span>{{ item.label }}</span>
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
                <div class="flex items-center" v-if="user.picture">
                    <Avatar :image="user.picture" shape="circle" />
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
                    items: [
                        {
                            label: 'Configure Tournament',
                            icon: 'pi pi-bolt',
                            to: '/setup'
                        },
                        {
                            label: 'Player Database',
                            icon: 'pi pi-bolt',
                            to: '/players'
                        },
                        {
                            separator: true
                        },
                        {
                            label: 'League',
                            icon: 'pi pi-pencil',
                        }
                    ]
                },
                {
                    label: 'Logout',
                    command: () => {
                        this.logout();
                    }
                }
            ],
            user: {
                name: null,
                email: null,
                picture: null
            }
        }
    },
    async mounted() {
        const supabase = useSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        this.user = user.user_metadata;
    },
    methods: {
        async logout() {
            const supabase = useSupabaseClient();
            const { error } = await supabase.auth.signOut();
            await navigateTo('/login');
        }
    }
};
</script>
