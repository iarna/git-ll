#!/usr/bin/env node
'use strict'
const fun = require('funstream')
const byline = require('byline')
const spawn = require('child_process').spawn
const cc = require('console-control-strings')

const pretty = `--pretty=format:{"commit":"%H","refs":"%D","author": {"name": "%aN", "email": "%aE", "date": "%aD"}}%nSUBJECT:%s:SUBJECT%nBODY:%b:BODY%n`

let commit = {}
let state = 'commit'

fun(spawn('git', ['log', '--no-abbrev-commit', pretty]).stdout, {encoding: 'utf8'})
  .pipe(byline.createStream())
  .map(l => l.toString())
  .map(l => {
    if (state === 'commit') {
      commit = JSON.parse(l) 
      commit.subject = ''
      commit.body = []
      state = 'startsubject'
    } else if (state === 'startsubject' || state === 'subject') {
      if (state === 'subject') {
        commit.subject +=  '\n' + l
      } else {
        state = 'subject'
        commit.subject += l.replace(/^SUBJECT:/, '')
      }
      if (/:SUBJECT$/.test(commit.subject)) {
        state = 'startbody'
        commit.subject = commit.subject.replace(/:SUBJECT$/, '')
      }
     } else if (state === 'startbody' || state === 'body') {
      if (state === 'body') {
        commit.body.push(l)
      } else {
        commit.body.push(l.replace(/^BODY:/, ''))
        state = 'body'
      }
      if (/:BODY$/.test(commit.body[commit.body.length - 1])) {
        state = 'commit'
        commit.body[commit.body.length - 1] = commit.body[commit.body.length - 1].replace(/:BODY$/, '')
        return commit
      }
    }
  })
  .filter(c => c)
  .map(c => {
    const credit = c.body
      .filter(b => /^Credit:/.test(b))
      .map(b => b.replace(/^Credit:\s*/, '').trim())
      .join(', ')
    const rev = c.body
      .filter(b => /^Reviewed-By:/.test(b))
      .map(b => b.replace(/^Reviewed-By:\s*/, '').trim())
      .join(', ')
    const fixes = c.body
      .filter(b => /^Fixes:/.test(b))
      .map(b => b.replace(/^Fixes:\s*/, '').trim())
      .map(b => b.replace(/^.*[/]npm[/]npm[/].*[/](\d+)/g, '#$1'))
      .map(b => b.replace(/^.*[/](.*)[/](.*)[/].*[/](\d+)/g, '$1/$2#$3'))
      .join(', ')
    const prs = c.body
      .filter(b => /^PR-URL:/.test(b))
      .map(b => b.replace(/^PR-URL:\s*/, '').trim())
      .map(b => b.replace(/^.*[/]npm[/]npm[/].*[/](\d+)/g, '#$1'))
      .map(b => b.replace(/^.*[/](.*)[/](.*)[/].*[/](\d+)/g, '$1/$2#$3'))
      .join(', ')
    let out = `${cc.color('yellow')}${c.commit.slice(0,9)}${cc.color('reset')}`
    if (rev) {
      out += `^`
    } else {
      out += ' '
    }
    if (c.refs) {
      out += `${cc.color('green')}(${c.refs})${cc.color('reset')} `
    }
    if (prs) {
      out += `${cc.color('green')}${prs}${cc.color('reset')} `
    }
    if (fixes) {
      out += `${cc.color('green')}[${fixes}]${cc.color('reset')} `
    }
    out += `${c.subject}`
    const date = new Date(c.author.date)
    out += ` ${cc.color('brightBlack')}(`
    if (credit) {
      out += `${cc.color('bold')}${credit}${cc.color('stopBold')}`
    } else {
      out += c.author.name
    }
    out += ` on ${date.toISOString().slice(0,10)}`
    if (rev) out += ` ↑${rev}`
    out += `)${cc.color('reset')}`
    return out + '\n'
  })
  .pipe(process.stdout.isTTY ? spawn('less', ['-REX'], {stdio: ['pipe', 1, 2]}).stdin : process.stdout)
  .on('error', () => process.exit(1))
