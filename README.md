Audica [![Build Status](https://travis-ci.org/Dica-Developer/HtmlPlayer.png?branch=master)](https://travis-ci.org/Dica-Developer/HtmlPlayer)
=====

A HTML5 player that can stream songs from a subsonic server, ubuntu one server and play local files.
It allows complete keyboard, mouse and/or touch usage. Audica is as easy to use and clutter free
as possible.

Concepts
-------

Audica has two different views. The player and the search view. The player view is shown on startup and
on show the right side cover art, on the left side artist, album and title of a song. On the buttom is
a progress bar shown. The search view shows two boxes. On the left you will see all songs from the choosen
backend and on the right the box for your playlist.
On every time you can use your prefered input method and Audica shows what is possible.

### Mouse

* player view

        move around ... shows progress timing and player usage elements
        move near to the left side ... previews search view selecting it changes to it)

* search view

        click a songs ... select a song
        <ctrl> + click a song ... selects all clicked songs
        <shift> + click two songs ... selects all songs between the clicked
        double click a song on the left list ... adds it to the playlist
        double click a song on the right list ... removes it from the playlist
        move near to the right side ... previews player view selecting it changes to it

### Keyboard

* player view

        n ... jumps to next songs
        p ... jumps to previous song
        <space> ... starts/stop playing
        l ... switches to the search view

* search view

        <tab> ... switch between the song and the playlist box
        <cursor up/down> ... select a song
        <shift> + <cursor up/down> ... select multiple songs
        <cursor left> ... removes a selected song from the playlist box
        <cursor right> ... adds a selected song from the song box to the playlist box
        <esc> ... switches to the player view

### Touch
