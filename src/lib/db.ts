import Dexie, { type Table } from 'dexie';
import { TranslationUnit, Project, ProjectFile, Glossary, UserDefinedCheck, QAProfile } from './types';

export class HeartfeltDatabase extends Dexie {
  projects!: Table<Project, string>;
  files!: Table<ProjectFile, string>;
  segments!: Table<TranslationUnit, string>;
  glossaries!: Table<Glossary, string>;
  userChecks!: Table<UserDefinedCheck, string>;
  profiles!: Table<QAProfile, string>;

  constructor() {
    super('HeartfeltDB');
    this.version(8).stores({
      projects: 'id, name, lastOpened',
      files: 'id, projectId, name, [projectId+sourceLang+targetLang]',
      segments: 'id, tu_id, projectId, fileId, order, status, [projectId+status], [projectId+sourceLang+targetLang]',
      glossaries: 'id, name',
      userChecks: 'id, title, group',
      profiles: 'id, profileName, targetLocale'
    });
  }
}

export const db = new HeartfeltDatabase();
