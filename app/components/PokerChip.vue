<template>
    <svg class="poker-chip" width="50" height="50" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="95" :fill="primaryColour" stroke="#000" stroke-width="5"/>
        <circle cx="100" cy="100" r="75" fill="#ffffff" stroke="#000" stroke-width="4" />
        <g transform="rotate(0 100 100)">
            <path d="M100,5 A95,95 0 0,1 145.6,14.4 L135.6,35.4 A75,75 0 0,0 100,25 Z" fill="#ffffff"/>
        </g>
        <g transform="rotate(60 100 100)">
            <path d="M100,5 A95,95 0 0,1 145.6,14.4 L135.6,35.4 A75,75 0 0,0 100,25 Z" fill="#ffffff"/>
        </g>
        <g transform="rotate(120 100 100)">
            <path d="M100,5 A95,95 0 0,1 145.6,14.4 L135.6,35.4 A75,75 0 0,0 100,25 Z" fill="#ffffff"/>
        </g>
        <g transform="rotate(180 100 100)">
            <path d="M100,5 A95,95 0 0,1 145.6,14.4 L135.6,35.4 A75,75 0 0,0 100,25 Z" fill="#ffffff"/>
        </g>
        <g transform="rotate(240 100 100)">
            <path d="M100,5 A95,95 0 0,1 145.6,14.4 L135.6,35.4 A75,75 0 0,0 100,25 Z" fill="#ffffff"/>
        </g>
        <g transform="rotate(300 100 100)">
            <path d="M100,5 A95,95 0 0,1 145.6,14.4 L135.6,35.4 A75,75 0 0,0 100,25 Z" fill="#ffffff"/>
        </g>
        <circle cx="100" cy="100" r="95" fill="none" stroke="black" stroke-opacity="0.1" stroke-width="8"/>

        <text x="100" y="115" text-anchor="middle" font-size="40" font-family="Arial" fill="black">
            {{ chipValue }}
        </text>
    </svg>
</template>

<script>
export default {
    props: {
        primaryColour: {
            type: String,
            default: '#ff6633'
        },
        secondaryColour: {
            type: String,
            value: '#fff'
        },
        chipValue: {
            type: Number,
            default: 0
        }
    }
}
</script>