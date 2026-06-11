#include "OpenRelTable.h"
#include <cstring>
#include <stdlib.h>
#include <stdio.h>

// Define the static Open Relation Table
OpenRelTableMetaInfo OpenRelTable::tableMetaInfo[MAX_OPEN];


void clearList(AttrCacheEntry *head)
{
    for (AttrCacheEntry *it = head, *next; it != nullptr; it = next)
    {
        next = it->next;
        free(it);
    }
}


// Function to create a linked list of AttrCacheEntry nodes
AttrCacheEntry *createAttrCacheEntryList(int size)
{
    AttrCacheEntry *head = nullptr, *curr = nullptr;
    head = curr = (AttrCacheEntry *)malloc(sizeof(AttrCacheEntry));
    size--;
    while (size--)
    {
        curr->next = (AttrCacheEntry *)malloc(sizeof(AttrCacheEntry));
        curr = curr->next;
    }
    curr->next = nullptr;

    return head;
}

// Constructor - Initializes Open Relation Table
OpenRelTable::OpenRelTable()
{

    // initialize relCache and attrCache with nullptr
    for (int i = 0; i < MAX_OPEN; ++i)
    {
        RelCacheTable::relCache[i] = nullptr;
        AttrCacheTable::attrCache[i] = nullptr;
        tableMetaInfo[i].free = true ;
    }

    /**** Setting up Relation Cache entries ****/
    // (we need to populate relation cache with entries for the relation catalog
    //  and attribute catalog.)

    // setting up the variables
    RecBuffer relCatBlock(RELCAT_BLOCK);
    Attribute relCatRecord[RELCAT_NO_ATTRS];
    RelCacheEntry *relCacheEntry = nullptr;

    for (int relId = RELCAT_RELID; relId <= ATTRCAT_RELID; relId++)
    {
        relCatBlock.getRecord(relCatRecord, relId);

        relCacheEntry = (RelCacheEntry *)malloc(sizeof(RelCacheEntry));
        RelCacheTable::recordToRelCatEntry(relCatRecord, &(relCacheEntry->relCatEntry));
        relCacheEntry->recId.block = RELCAT_BLOCK;
        relCacheEntry->recId.slot = relId;

        RelCacheTable::relCache[relId] = relCacheEntry;
    }
    

    /**** Setting up Attribute cache entries ****/
    // (we need to populate attribute cache with entries for the relation catalog
    //  and attribute catalog.)

    // setting up the variables
    RecBuffer attrCatBlock(ATTRCAT_BLOCK);
    Attribute attrCatRecord[ATTRCAT_NO_ATTRS];
    AttrCacheEntry *attrCacheEntry = nullptr, *head = nullptr;

    for (int relId = RELCAT_RELID, recordId = 0; relId <= ATTRCAT_RELID; relId++)
    {
        int numberOfAttributes = RelCacheTable::relCache[relId]->relCatEntry.numAttrs;
        head = createAttrCacheEntryList(numberOfAttributes);
        attrCacheEntry = head;

        while (numberOfAttributes--)
        {
            attrCatBlock.getRecord(attrCatRecord, recordId);

            AttrCacheTable::recordToAttrCatEntry(
                attrCatRecord,
                &(attrCacheEntry->attrCatEntry));
            attrCacheEntry->recId.slot = recordId++;
            attrCacheEntry->recId.block = ATTRCAT_BLOCK;

            attrCacheEntry = attrCacheEntry->next;
        }

        AttrCacheTable::attrCache[relId] = head;
    }
     tableMetaInfo[RELCAT_RELID].free = false;
     tableMetaInfo[ATTRCAT_RELID].free = false;
     strcpy(tableMetaInfo[RELCAT_RELID].relName, "RELATIONCAT");
     strcpy(tableMetaInfo[ATTRCAT_RELID].relName, "ATTRIBUTECAT");
}

// Destructor - Closes all open relations STAGE 7
// OpenRelTable::~OpenRelTable() {
//     for (int i = 2; i < MAX_OPEN; ++i) {
//         if (!tableMetaInfo[i].free) {
//             closeRel(i);
//         }
//     }

//     // Free memory for Relation Catalog
//     free(RelCacheTable::relCache[RELCAT_RELID]);
//     RelCacheTable::relCache[RELCAT_RELID] = nullptr;

//     AttrCacheEntry* current = AttrCacheTable::attrCache[RELCAT_RELID];
//     while (current) {
//         AttrCacheEntry* next = current->next;
//         free(current);
//         current = next;
//     }
//     AttrCacheTable::attrCache[RELCAT_RELID] = nullptr;

//     // Free memory for Attribute Catalog
//     free(RelCacheTable::relCache[ATTRCAT_RELID]);
//     RelCacheTable::relCache[ATTRCAT_RELID] = nullptr;

//     current = AttrCacheTable::attrCache[ATTRCAT_RELID];
//     while (current) {
//         AttrCacheEntry* next = current->next;
//         free(current);
//         current = next;
//     }
//     AttrCacheTable::attrCache[ATTRCAT_RELID] = nullptr;
// }

// Destructor - STAGE 8
OpenRelTable::~OpenRelTable() {

    for ( int i = 2 ; i< MAX_OPEN ; i++)
    {
        if (!tableMetaInfo[i].free)
        {
            // close the relation using openRelTable::closeRel().
            OpenRelTable::closeRel(i);
        }
    }
     
     // Not For Stage - 5 ;
    /** Closing the catalog relations in the relation cache **/

    //releasing the relation cache entry of the attribute catalog

    if (RelCacheTable::relCache[ATTRCAT_RELID]->dirty == true) {

        /* Get the Relation Catalog entry from RelCacheTable::relCache
        Then convert it to a record using RelCacheTable::relCatEntryToRecord(). */
             RelCatEntry relCatBuffer ;
             RelCacheTable::getRelCatEntry(ATTRCAT_RELID , &relCatBuffer);
            union Attribute record[RELCAT_NO_ATTRS];
            RelCacheTable::relCatEntryToRecord(&relCatBuffer, record);

            RecId recId = RelCacheTable::relCache[ATTRCAT_RELID]->recId;
        // declaring an object of RecBuffer class to write back to the buffer
        RecBuffer relCatBlock(recId.block);

        // Write back to the buffer using relCatBlock.setRecord() with recId.slot
        relCatBlock.setRecord(record, recId.slot);
    }
    // free the memory dynamically allocated to this RelCacheEntry
     free(RelCacheTable::relCache[ATTRCAT_RELID]);

    //releasing the relation cache entry of the relation catalog

    if(RelCacheTable::relCache[RELCAT_RELID]->dirty == true){ 

        /* Get the Relation Catalog entry from RelCacheTable::relCache
        Then convert it to a record using RelCacheTable::relCatEntryToRecord(). */
         RelCatEntry relCatBuffer;
		RelCacheTable::getRelCatEntry(RELCAT_RELID,&relCatBuffer);
        union Attribute record[RELCAT_NO_ATTRS];
        RelCacheTable::relCatEntryToRecord(&relCatBuffer, record);
        RecId recId = RelCacheTable::relCache[RELCAT_RELID]->recId;
        // declaring an object of RecBuffer class to write back to the buffer
        RecBuffer relCatBlock(recId.block);

        // Write back to the buffer using relCatBlock.setRecord() with recId.slot
        relCatBlock.setRecord(record, recId.slot);
    }
    // free the memory dynamically allocated for this RelCacheEntry
    free(RelCacheTable::relCache[RELCAT_RELID]);

    // free the memory allocated for the attribute cache entries of the
    // relation catalog and the attribute catalog
   for(int relID=RELCAT_RELID;relID<=ATTRCAT_RELID;relID++){
		AttrCacheEntry *curr=AttrCacheTable::attrCache[relID],*next=NULL;
		while(curr!=nullptr){
			next=curr->next;
			if(curr->dirty==true){
				AttrCatEntry attrCatEntry=curr->attrCatEntry;
				Attribute AttrCatrecord[ATTRCAT_NO_ATTRS];
				AttrCacheTable::attrCatEntryToRecord(&attrCatEntry,AttrCatrecord);
				RecBuffer attrCatBlock(curr->recId.block);
				attrCatBlock.setRecord(AttrCatrecord,curr->recId.slot);
			}
			free(curr);
			curr=next;
		}
	}
}

//Open a Relation
int OpenRelTable::openRel(char relName[ATTR_SIZE]) {
    int relId = OpenRelTable::getRelId(relName);
    if(relId >= 0){
        return relId;
    }

    relId = OpenRelTable::getFreeOpenRelTableEntry();

    if(relId == E_CACHEFULL){
        return E_CACHEFULL;
    }

   /** Setting up Relation Cache entry for the relation **/

  /* search for the entry with relation name, relName, in the Relation Catalog using
      BlockAccess::linearSearch().
      Care should be taken to reset the searchIndex of the relation RELCAT_RELID
      before calling linearSearch().*/

      Attribute attrval ;
      strcpy(attrval.sVal , relName);
      RelCacheTable::resetSearchIndex(RELCAT_RELID);
      RecId recId = BlockAccess::linearSearch(RELCAT_RELID , RELCAT_ATTR_RELNAME ,attrval, EQ);
      
      if(recId.block == -1 || recId.slot == -1){
          return E_RELNOTEXIST;
      }

      /* read the record entry corresponding to relcatRecId and create a relCacheEntry
      on it using RecBuffer::getRecord() and RelCacheTable::recordToRelCatEntry().
      update the recId field of this Relation Cache entry to relcatRecId.
      use the Relation Cache entry to set the relId-th entry of the RelCacheTable.
    NOTE: make sure to allocate memory for the RelCacheEntry using malloc()
  */
    RecBuffer relBuffer(recId.block);
    Attribute relRecord[RELCAT_NO_ATTRS];
    RelCacheEntry *relCacheBuffer = nullptr;

    relBuffer.getRecord(relRecord, recId.slot);

    relCacheBuffer = (RelCacheEntry *)malloc(sizeof(RelCacheEntry));
    RelCacheTable::recordToRelCatEntry(relRecord, &(relCacheBuffer->relCatEntry));

    relCacheBuffer->recId.block = recId.block;
    relCacheBuffer->recId.slot = recId.slot;

    RelCacheTable::relCache[relId] = relCacheBuffer;
    // int b;
    // b=(relCacheBuffer->relCatEntry.numRecs)/relCacheBuffer->relCatEntry.numSlotsPerBlk +1;
    // printf("%d\n",b);

    /** Setting up Attribute Cache entries for the relation **/
    Attribute attrCatRecord[ATTRCAT_NO_ATTRS];
    // Attribute attrRecord[ATTRCAT_NO_ATTRS];

    AttrCacheEntry *attrCacheBuffer = nullptr, *head = nullptr;

    int numberofattributes = RelCacheTable::relCache[relId]->relCatEntry.numAttrs; 
    head = createAttrCacheEntryList(numberofattributes);
    attrCacheBuffer = head;

      RelCacheTable::resetSearchIndex(ATTRCAT_RELID);

    for(int i = 0 ; i< numberofattributes ; i++){
        RecId attrecId = BlockAccess::linearSearch(ATTRCAT_RELID , RELCAT_ATTR_RELNAME , attrval , EQ);
        RecBuffer attrBuffer(attrecId.block);
        attrBuffer.getRecord(attrCatRecord , attrecId.slot);

        AttrCacheTable::recordToAttrCatEntry(attrCatRecord , &(attrCacheBuffer->attrCatEntry));
        attrCacheBuffer->recId.block = attrecId.block;
        attrCacheBuffer->recId.slot = attrecId.slot;

        attrCacheBuffer = attrCacheBuffer->next;
    }

    AttrCacheTable::attrCache[relId] = head;

    tableMetaInfo[relId].free = false;
    strcpy(tableMetaInfo[relId].relName , relName);
    return relId;

}


// Stage 11
int OpenRelTable::closeRel(int relId) {
    if (relId == RELCAT_RELID || relId == ATTRCAT_RELID) 
        return E_NOTPERMITTED;

    if (0 > relId || relId >= MAX_OPEN) 
        return E_OUTOFBOUND;

    if (tableMetaInfo[relId].free) 
        return E_RELNOTOPEN;

    if (RelCacheTable::relCache[relId]->dirty == true) {
      /* Get the Relation Catalog entry from RelCacheTable::relCache
      Then convert it to a record using RelCacheTable::relCatEntryToRecord(). */
      Attribute relCatBuffer [RELCAT_NO_ATTRS];
      RelCacheTable::relCatEntryToRecord(&(RelCacheTable::relCache[relId]->relCatEntry), relCatBuffer);

      // declaring an object of RecBuffer class to write back to the buffer
      RecId recId = RelCacheTable::relCache[relId]->recId;
      RecBuffer relCatBlock(recId.block);

      // Write back to the buffer using relCatBlock.setRecord() with recId.slot
      relCatBlock.setRecord(relCatBuffer, RelCacheTable::relCache[relId]->recId.slot);
  }

  // free the memory allocated in the relation and attribute caches which was
  // allocated in the OpenRelTable::openRel() function
  free (RelCacheTable::relCache[relId]);
  
  // // RelCacheEntry *relCacheBuffer = RelCacheTable::relCache[relId];

  //* because we are not modifying the attribute cache at this stage,
  //* write-back is not required. We will do it in subsequent
    //* stages when it becomes needed)

  AttrCacheEntry *head = AttrCacheTable::attrCache[relId];
  AttrCacheEntry *next = head->next;

  while (true) {
      if (head->dirty)
      {
          Attribute attrCatRecord [ATTRCAT_NO_ATTRS];
          AttrCacheTable::attrCatEntryToRecord(&(head->attrCatEntry), attrCatRecord);

          RecBuffer attrCatBlockBuffer (head->recId.block);
          attrCatBlockBuffer.setRecord(attrCatRecord, head->recId.slot);
      }


      free (head);
      head = next;

      if (head == NULL) break;
      next = next->next;
  }

  // update tableMetaInfo to set relId as a free slot
  // update relCache and attrCache to set the entry at relId to nullptr
  tableMetaInfo[relId].free = true;
  RelCacheTable::relCache[relId] = nullptr;
  AttrCacheTable::attrCache[relId] = nullptr;

return SUCCESS;
}


// Get Relation ID
int OpenRelTable::getRelId(char relName[ATTR_SIZE]) {
    for (int i = 0; i < MAX_OPEN; ++i) {
        if (!tableMetaInfo[i].free && strcmp(tableMetaInfo[i].relName, relName) == 0) {
            return i;
        }
    }
    return E_RELNOTOPEN;
}

// Find a free slot in the Open Relation Table
int OpenRelTable::getFreeOpenRelTableEntry() {
    for (int i = 0; i < MAX_OPEN; ++i) {
        if (tableMetaInfo[i].free) return i;
    }
    return E_CACHEFULL;
}
